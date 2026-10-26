/**
 * Finance Service - Business rules and logic for Invoices, Payments, Financial Transactions, Profit Calculation, and Dashboard Metrics
 */

(function(window) {
  'use strict';

  const financeService = {
    /**
     * Get all invoices with computed paid amounts and balance
     */
    getInvoices: function(filter = {}) {
      let list = db.all('invoices');

      if (filter.status && filter.status !== 'ALL') {
        list = list.filter(i => i.status === filter.status);
      }

      return list.map(inv => {
        const order = db.find('orders', inv.order_id);
        const customer = order ? db.find('customers', order.customer_id) : null;
        const payments = db.where('payments', p => p.invoice_id == inv.invoice_id);
        const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalAmount = Number(inv.total_amount || 0);
        const balance = Math.max(0, totalAmount - paidAmount);

        return Object.assign({}, inv, {
          order: order,
          customer: customer,
          paid_amount: paidAmount,
          balance: balance,
          payments_count: payments.length
        });
      }).sort((a, b) => b.invoice_id - a.invoice_id);
    },

    /**
     * Get single invoice with customer, order, and payment history
     */
    getInvoice: function(id) {
      const inv = db.find('invoices', id);
      if (!inv) return null;

      const order = db.find('orders', inv.order_id);
      const customer = order ? db.find('customers', order.customer_id) : null;
      const payments = db.where('payments', p => p.invoice_id == inv.invoice_id)
        .sort((a, b) => b.payment_id - a.payment_id);
      const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalAmount = Number(inv.total_amount || 0);
      const balance = Math.max(0, totalAmount - paidAmount);

      return Object.assign({}, inv, {
        order,
        customer,
        payments,
        paid_amount: paidAmount,
        balance: balance
      });
    },

    /**
     * Record payment for invoice (PRD 6.7):
     * Amount > 0, amount <= balance.
     * Insert payments row, insert finance_transactions (INCOME).
     * Invoice status -> 'Partially Paid' or 'Paid'.
     * If invoice is 'Paid' AND order is 'Delivered' -> order status becomes 'Completed'.
     */
    recordPayment: function(paymentData) {
      const { invoice_id, amount, method, payment_date } = paymentData;

      const invoice = this.getInvoice(invoice_id);
      if (!invoice) {
        return { success: false, error: 'Invoice not found.' };
      }

      if (invoice.status === 'Paid' || invoice.balance <= 0) {
        return { success: false, error: 'This invoice has already been fully paid.' };
      }

      const payAmount = Number(amount);
      if (isNaN(payAmount) || payAmount <= 0) {
        return { success: false, error: 'Payment amount must be greater than 0.' };
      }

      if (payAmount > invoice.balance) {
        return {
          success: false,
          error: `Payment cannot exceed remaining balance of ${utils.formatRupiah(invoice.balance)}.`
        };
      }

      if (!method) {
        return { success: false, error: 'Payment method (Cash or Bank Transfer) is required.' };
      }

      const date = payment_date || utils.getTodayDate();

      // 1. Insert payments record
      const payment = db.insert('payments', {
        invoice_id: Number(invoice_id),
        payment_date: date,
        amount: payAmount,
        method: method
      });

      // 2. Insert finance_transactions (INCOME)
      db.insert('finance_transactions', {
        payment_id: payment.payment_id,
        production_id: null,
        movement_id: null,
        trx_type: 'INCOME',
        amount: payAmount,
        trx_date: date,
        description: `Payment for ${invoice.invoice_code} (${method})`
      });

      // 3. Update invoice status
      const newBalance = Math.round((invoice.balance - payAmount) * 100) / 100;
      const updatedStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
      db.update('invoices', invoice_id, { status: updatedStatus });

      // 4. If invoice is Paid AND order is Delivered -> order status becomes Completed
      if (updatedStatus === 'Paid' && invoice.order) {
        const currentOrder = db.find('orders', invoice.order.order_id);
        if (currentOrder && currentOrder.status === 'Delivered') {
          db.update('orders', currentOrder.order_id, { status: 'Completed' });
        }
      }

      return {
        success: true,
        payment: payment,
        invoice: this.getInvoice(invoice_id)
      };
    },

    /**
     * Get all payments with invoice and customer context
     */
    getPayments: function() {
      const list = db.all('payments');
      return list.map(p => {
        const inv = db.find('invoices', p.invoice_id);
        const order = inv ? db.find('orders', inv.order_id) : null;
        const customer = order ? db.find('customers', order.customer_id) : null;
        return Object.assign({}, p, { invoice: inv, order, customer });
      }).sort((a, b) => b.payment_id - a.payment_id);
    },

    /**
     * Get financial transaction ledger with totals (PRD 7.6)
     */
    getTransactions: function(filter = {}) {
      let trxs = db.all('finance_transactions');

      if (filter.trx_type && filter.trx_type !== 'ALL') {
        trxs = trxs.filter(t => t.trx_type === filter.trx_type);
      }

      let totalIncome = 0;
      let totalProdCost = 0;
      let totalMaterialPurchase = 0;

      const hydrated = trxs.map(t => {
        const amt = Number(t.amount || 0);
        if (t.trx_type === 'INCOME') totalIncome += amt;
        else if (t.trx_type === 'PRODUCTION_COST') totalProdCost += amt;
        else if (t.trx_type === 'MATERIAL_PURCHASE') totalMaterialPurchase += amt;

        let linkedOrderCode = '-';
        if (t.payment_id) {
          const pay = db.find('payments', t.payment_id);
          const inv = pay ? db.find('invoices', pay.invoice_id) : null;
          const ord = inv ? db.find('orders', inv.order_id) : null;
          if (ord) linkedOrderCode = ord.order_code;
        } else if (t.production_id) {
          const po = db.find('production_orders', t.production_id);
          const item = po ? db.find('order_items', po.item_id) : null;
          const ord = item ? db.find('orders', item.order_id) : null;
          if (ord) linkedOrderCode = ord.order_code;
        }

        return Object.assign({}, t, { linked_order_code: linkedOrderCode });
      }).sort((a, b) => {
        if (a.trx_date !== b.trx_date) return b.trx_date.localeCompare(a.trx_date);
        return b.trx_id - a.trx_id;
      });

      return {
        transactions: hydrated,
        totals: {
          income: totalIncome,
          production_cost: totalProdCost,
          material_purchase: totalMaterialPurchase
        }
      };
    },

    /**
     * Calculate profit per order (PRD 6.11 & 7.6):
     * Order profit = order total_amount - production cost (material cost only)
     * Margin % = profit / total_amount * 100
     */
    getOrderProfitSummary: function() {
      const orders = db.all('orders');
      const prodCostTrxs = db.all('finance_transactions').filter(t => t.trx_type === 'PRODUCTION_COST');

      const result = orders.map(ord => {
        const cust = db.find('customers', ord.customer_id);
        const inv = db.where('invoices', i => i.order_id == ord.order_id)[0] || null;
        
        // Find production orders of this order
        const items = db.where('order_items', it => it.order_id == ord.order_id);
        const itemIds = items.map(it => it.item_id);
        const pos = db.where('production_orders', p => itemIds.includes(p.item_id));
        const poIds = pos.map(p => p.production_id);

        // Sum production costs from transactions or stock movements
        const costTrxs = prodCostTrxs.filter(t => poIds.includes(t.production_id));
        let materialCost = costTrxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // If no cost trx yet but OUT movements exist (e.g. In Production)
        if (materialCost === 0 && poIds.length > 0) {
          const movements = db.where('stock_movements', m => poIds.includes(m.production_id) && m.movement_type === 'OUT');
          materialCost = movements.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
        }

        const revenue = Number(ord.total_amount || 0);
        const profit = revenue - materialCost;
        const marginPct = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;

        return {
          order_id: ord.order_id,
          order_code: ord.order_code,
          customer_name: cust ? cust.name : 'Unknown',
          order_date: ord.order_date,
          order_status: ord.status,
          invoice_status: inv ? inv.status : 'No Invoice',
          has_invoice: !!inv,
          revenue: revenue,
          material_cost: materialCost,
          profit: profit,
          margin_pct: marginPct
        };
      });

      return result.sort((a, b) => a.margin_pct - b.margin_pct); // default lowest margin first for owner visibility
    },

    /**
     * Compute all 6 Dashboard metrics live from shared data (PRD 7.2)
     */
    getDashboardMetrics: function() {
      const orders = db.all('orders');
      const materials = inventoryService.getMaterials();
      const pos = db.all('production_orders');
      const stages = db.all('production_stages');
      const invoices = this.getInvoices();
      const profitSummary = this.getOrderProfitSummary();
      const today = utils.getTodayDate();
      const currentYearMonth = today.slice(0, 7); // e.g. '2026-10'

      // 1. Sales this month + monthly sales breakdown
      const monthlySalesMap = {};
      let salesThisMonth = 0;

      orders.forEach(o => {
        const amt = Number(o.total_amount || 0);
        const ym = (o.order_date || '').slice(0, 7);
        if (ym) {
          monthlySalesMap[ym] = (monthlySalesMap[ym] || 0) + amt;
        }
        if (ym === currentYearMonth) {
          salesThisMonth += amt;
        }
      });

      // 2. Stock level & low stock count
      const lowStockMaterials = materials.filter(m => m.is_low);

      // 3. Orders by status & production orders by stage
      const orderStatusCounts = {
        'Confirmed': 0,
        'In Production': 0,
        'Ready for Delivery': 0,
        'Delivered': 0,
        'Completed': 0
      };
      orders.forEach(o => {
        if (orderStatusCounts[o.status] !== undefined) {
          orderStatusCounts[o.status]++;
        }
      });

      const stageCounts = {
        'Thread Preparation': 0,
        'Dyeing': 0,
        'Weaving': 0,
        'Finishing': 0
      };
      // Count in-progress production orders at each stage
      pos.forEach(p => {
        if (p.status === 'In Progress') {
          const poStages = stages.filter(s => s.production_id == p.production_id);
          const currentStage = poStages.find(s => s.status === 'In Progress');
          if (currentStage && stageCounts[currentStage.stage_name] !== undefined) {
            stageCounts[currentStage.stage_name]++;
          }
        }
      });

      // 4. Production progress & late orders
      const inProgressOrders = orders.filter(o => o.status === 'In Production').map(o => {
        const cust = db.find('customers', o.customer_id);
        const isLate = o.due_date && o.due_date < today;
        return Object.assign({}, o, { customer: cust, is_late: isLate });
      });

      // 5. Unpaid invoices count and total outstanding amount
      const unpaidInvoices = invoices.filter(i => i.status !== 'Paid');
      const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + i.balance, 0);

      // 6. Total profit calculation
      // PRD 6.11: Dashboard profit = SUM of order profit for orders that have an invoice
      let totalRevenue = 0;
      let totalProdCost = 0;
      profitSummary.forEach(p => {
        if (p.has_invoice) {
          totalRevenue += p.revenue;
          totalProdCost += p.material_cost;
        }
      });
      const totalProfit = totalRevenue - totalProdCost;

      return {
        salesThisMonth,
        monthlySalesMap,
        materials,
        lowStockCount: lowStockMaterials.length,
        orderStatusCounts,
        stageCounts,
        inProgressOrders,
        unpaidInvoicesCount: unpaidInvoices.length,
        totalUnpaidAmount,
        totalRevenue,
        totalProdCost,
        totalProfit
      };
    }
  };

  window.financeService = financeService;
})(window);
