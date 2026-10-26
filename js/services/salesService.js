/**
 * Sales Service - Business rules and logic for Customers, Orders, Deliveries, and Traceability
 */

(function(window) {
  'use strict';

  const salesService = {
    /**
     * Calculate total material requirements for given order items
     * items: [ { product_id, quantity_m } ]
     */
    calculateMaterialRequirements: function(items) {
      const allMaterials = db.all('materials');
      const allReqs = db.all('material_requirements');
      const materialMap = {};

      allMaterials.forEach(m => {
        materialMap[m.material_id] = {
          material_id: m.material_id,
          material_name: m.material_name,
          material_type: m.material_type,
          unit: m.unit,
          current_stock: Number(m.current_stock),
          min_stock: Number(m.min_stock),
          unit_cost: Number(m.unit_cost),
          needed_qty: 0
        };
      });

      if (Array.isArray(items)) {
        items.forEach(item => {
          const qty = Number(item.quantity_m) || 0;
          const reqs = allReqs.filter(r => r.product_id == item.product_id);
          reqs.forEach(r => {
            if (materialMap[r.material_id]) {
              materialMap[r.material_id].needed_qty += qty * Number(r.qty_per_meter);
            }
          });
        });
      }

      // Format decimal precision and check shortage
      const result = [];
      Object.values(materialMap).forEach(mat => {
        mat.needed_qty = Math.round(mat.needed_qty * 1000) / 1000;
        mat.is_short = mat.needed_qty > mat.current_stock;
        mat.shortage = mat.is_short ? Math.round((mat.needed_qty - mat.current_stock) * 1000) / 1000 : 0;
        if (mat.needed_qty > 0) {
          result.push(mat);
        }
      });

      return result;
    },

    /**
     * Validate whether sufficient stock exists for the order items
     */
    validateStockAvailability: function(items) {
      const requirements = this.calculateMaterialRequirements(items);
      const shortMaterials = requirements.filter(r => r.is_short);
      return {
        valid: shortMaterials.length === 0,
        shortMaterials: shortMaterials,
        requirements: requirements
      };
    },

    /**
     * Create custom sales order (PRD 6.2)
     */
    createOrder: function(orderData) {
      const { customer_id, due_date, items } = orderData;

      if (!customer_id) {
        return { success: false, error: 'Customer is required.' };
      }
      if (!due_date) {
        return { success: false, error: 'Due date is required.' };
      }

      const today = utils.getTodayDate();
      if (due_date < today) {
        return { success: false, error: 'Due date cannot be earlier than today.' };
      }

      if (!items || !items.length) {
        return { success: false, error: 'At least one item is required.' };
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.product_id) {
          return { success: false, error: `Item #${i + 1}: Product must be selected.` };
        }
        if (!item.quantity_m || Number(item.quantity_m) <= 0) {
          return { success: false, error: `Item #${i + 1}: Quantity in meters must be greater than 0.` };
        }
      }

      // Check stock requirements before saving
      const stockCheck = this.validateStockAvailability(items);
      if (!stockCheck.valid) {
        const details = stockCheck.shortMaterials.map(m =>
          `${m.material_name}: needs ${m.needed_qty} ${m.unit}, available ${m.current_stock} ${m.unit}`
        ).join('; ');
        return {
          success: false,
          error: `Insufficient stock! ${details}`,
          shortMaterials: stockCheck.shortMaterials
        };
      }

      // Calculate total amount with frozen prices
      let totalAmount = 0;
      const preparedItems = [];
      items.forEach(it => {
        const prod = db.find('products', it.product_id);
        const unitPrice = prod ? Number(prod.price_per_meter) : 0;
        const qty = Number(it.quantity_m);
        totalAmount += unitPrice * qty;
        preparedItems.push({
          product_id: Number(it.product_id),
          size: it.size || 'Standard (2.5m x 1.05m)',
          quantity_m: qty,
          unit_price: unitPrice
        });
      });

      // Insert Order with status 'Confirmed'
      const orderCode = db.nextCode('SO-', 'orders');
      const newOrder = db.insert('orders', {
        order_code: orderCode,
        customer_id: Number(customer_id),
        order_date: today,
        due_date: due_date,
        status: 'Confirmed',
        total_amount: totalAmount
      });

      // Insert order items and create waiting production orders with 4 pending stages
      const stagesList = ['Thread Preparation', 'Dyeing', 'Weaving', 'Finishing'];
      preparedItems.forEach(it => {
        const savedItem = db.insert('order_items', {
          order_id: newOrder.order_id,
          product_id: it.product_id,
          size: it.size,
          quantity_m: it.quantity_m,
          unit_price: it.unit_price
        });

        const poCode = db.nextCode('PO-', 'production_orders');
        const savedPo = db.insert('production_orders', {
          production_code: poCode,
          item_id: savedItem.item_id,
          status: 'Waiting',
          start_date: null,
          due_date: newOrder.due_date,
          qty_finished: null,
          quality_note: null
        });

        stagesList.forEach(stg => {
          db.insert('production_stages', {
            production_id: savedPo.production_id,
            user_id: null,
            stage_name: stg,
            status: 'Pending',
            started_at: null,
            finished_at: null
          });
        });
      });

      return { success: true, order: newOrder };
    },

    /**
     * Record delivery for an order (PRD 6.6)
     */
    recordDelivery: function(deliveryData) {
      const { order_id, delivery_date, notes } = deliveryData;
      const order = db.find('orders', order_id);

      if (!order) {
        return { success: false, error: 'Order not found.' };
      }
      if (order.status !== 'Ready for Delivery') {
        return { success: false, error: `Cannot deliver order with status "${order.status}". Order must be "Ready for Delivery".` };
      }

      const today = utils.getTodayDate();
      const delivery = db.insert('deliveries', {
        order_id: Number(order_id),
        delivery_date: delivery_date || today,
        status: 'Delivered',
        notes: notes || ''
      });

      let updatedStatus = 'Delivered';
      // Check if invoice is already Paid
      const invoice = db.where('invoices', inv => inv.order_id == order_id)[0];
      if (invoice && invoice.status === 'Paid') {
        updatedStatus = 'Completed';
      }

      db.update('orders', order_id, { status: updatedStatus });

      return {
        success: true,
        delivery: delivery,
        order: db.find('orders', order_id)
      };
    },

    /**
     * Customer methods
     */
    getCustomers: function(query) {
      let list = db.all('customers');
      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        list = list.filter(c =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.customer_type && c.customer_type.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      }
      return list;
    },

    getCustomer: function(id) {
      return db.find('customers', id);
    },

    saveCustomer: function(data) {
      if (!data.name || !data.name.trim()) {
        return { success: false, error: 'Customer name is required.' };
      }
      if (!data.phone || !data.phone.trim()) {
        return { success: false, error: 'Phone number is required.' };
      }
      if (!data.customer_type) {
        return { success: false, error: 'Customer type is required.' };
      }

      if (data.customer_id) {
        const updated = db.update('customers', data.customer_id, data);
        return { success: true, customer: updated };
      } else {
        const inserted = db.insert('customers', data);
        return { success: true, customer: inserted };
      }
    },

    /**
     * Orders queries
     */
    getOrders: function(filter = {}) {
      let orders = db.all('orders');

      if (filter.status && filter.status !== 'ALL') {
        orders = orders.filter(o => o.status === filter.status);
      }

      if (filter.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        orders = orders.filter(o => {
          const cust = db.find('customers', o.customer_id);
          const custName = cust ? cust.name.toLowerCase() : '';
          return o.order_code.toLowerCase().includes(q) || custName.includes(q);
        });
      }

      // Hydrate customer
      return orders.map(o => {
        const cust = db.find('customers', o.customer_id);
        return Object.assign({}, o, { customer: cust });
      }).sort((a, b) => b.order_id - a.order_id);
    },

    getOrder: function(id) {
      const order = db.find('orders', id);
      if (!order) return null;

      const customer = db.find('customers', order.customer_id);
      const items = db.where('order_items', it => it.order_id == id).map(it => {
        const product = db.find('products', it.product_id);
        const po = db.where('production_orders', p => p.item_id == it.item_id)[0] || null;
        let stages = [];
        if (po) {
          stages = db.where('production_stages', stg => stg.production_id == po.production_id);
        }
        return Object.assign({}, it, { product, production_order: po, stages });
      });

      const delivery = db.where('deliveries', d => d.order_id == id)[0] || null;
      const invoice = db.where('invoices', inv => inv.order_id == id)[0] || null;
      let payments = [];
      if (invoice) {
        payments = db.where('payments', p => p.invoice_id == invoice.invoice_id);
      }

      return Object.assign({}, order, {
        customer,
        items,
        delivery,
        invoice,
        payments
      });
    },

    getDeliveries: function() {
      const deliveries = db.all('deliveries');
      return deliveries.map(d => {
        const order = db.find('orders', d.order_id);
        const customer = order ? db.find('customers', order.customer_id) : null;
        return Object.assign({}, d, { order, customer });
      }).sort((a, b) => b.delivery_id - a.delivery_id);
    },

    /**
     * Get end-to-end traceability graph/data for one order (PRD 7.7)
     */
    getOrderTraceability: function(orderId) {
      const order = this.getOrder(orderId);
      if (!order) return null;

      // Extract all production orders
      const pos = [];
      const stockMovements = [];
      let totalMaterialCost = 0;

      order.items.forEach(it => {
        if (it.production_order) {
          pos.push(it.production_order);
          const movements = db.where('stock_movements', m => m.production_id == it.production_order.production_id);
          movements.forEach(m => {
            const mat = db.find('materials', m.material_id);
            stockMovements.push(Object.assign({}, m, { material: mat }));
            totalMaterialCost += Number(m.total_cost || 0);
          });
        }
      });

      const prodCostTrxs = db.where('finance_transactions', trx =>
        trx.trx_type === 'PRODUCTION_COST' && pos.some(p => p.production_id == trx.production_id)
      );

      const incomeTrxs = [];
      if (order.payments && order.payments.length) {
        order.payments.forEach(p => {
          const trxs = db.where('finance_transactions', t => t.payment_id == p.payment_id);
          incomeTrxs.push(...trxs);
        });
      }

      return {
        order: order,
        customer: order.customer,
        items: order.items,
        production_orders: pos,
        stock_movements: stockMovements,
        total_material_cost: totalMaterialCost,
        production_cost_transactions: prodCostTrxs,
        delivery: order.delivery,
        invoice: order.invoice,
        payments: order.payments,
        income_transactions: incomeTrxs
      };
    }
  };

  window.salesService = salesService;
})(window);
