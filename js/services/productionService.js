/**
 * Production Service - Business rules and logic for Production Orders, 4-stage workflow, and Finished Goods confirmation
 */

(function(window) {
  'use strict';

  const STAGE_NAMES = ['Thread Preparation', 'Dyeing', 'Weaving', 'Finishing'];

  const productionService = {
    /**
     * Get list of production orders with full relations
     */
    getProductionOrders: function(filter = {}) {
      let list = db.all('production_orders');

      if (filter.status && filter.status !== 'ALL') {
        list = list.filter(p => p.status === filter.status);
      }

      const today = utils.getTodayDate();

      return list.map(po => {
        const item = db.find('order_items', po.item_id);
        const order = item ? db.find('orders', item.order_id) : null;
        const product = item ? db.find('products', item.product_id) : null;
        const stages = db.where('production_stages', s => s.production_id == po.production_id)
          .sort((a, b) => a.stage_id - b.stage_id);

        // Find current stage
        let currentStage = 'Finished';
        if (po.status === 'Waiting') {
          currentStage = 'Waiting to Start';
        } else if (po.status === 'In Progress') {
          const inProgressStage = stages.find(s => s.status === 'In Progress');
          currentStage = inProgressStage ? inProgressStage.stage_name : (stages[0] ? stages[0].stage_name : '-');
        }

        const isOverdue = po.status !== 'Completed' && po.due_date && po.due_date < today;

        return Object.assign({}, po, {
          item: item,
          order: order,
          product: product,
          stages: stages,
          current_stage_name: currentStage,
          is_overdue: isOverdue
        });
      }).sort((a, b) => b.production_id - a.production_id);
    },

    /**
     * Get single production order with detailed relations, stages, recipes and stock requirements
     */
    getProductionOrder: function(id) {
      const po = db.find('production_orders', id);
      if (!po) return null;

      const item = db.find('order_items', po.item_id);
      const order = item ? db.find('orders', item.order_id) : null;
      const customer = order ? db.find('customers', order.customer_id) : null;
      const product = item ? db.find('products', item.product_id) : null;

      const stages = db.where('production_stages', s => s.production_id == po.production_id)
        .sort((a, b) => a.stage_id - b.stage_id)
        .map(stg => {
          const officer = stg.user_id ? db.find('users', stg.user_id) : null;
          return Object.assign({}, stg, { officer: officer });
        });

      // Material requirements for this item
      const reqs = product ? db.where('material_requirements', r => r.product_id == product.product_id) : [];
      const requiredMaterials = reqs.map(r => {
        const mat = db.find('materials', r.material_id);
        const needed = Math.round((Number(item.quantity_m) * Number(r.qty_per_meter)) * 1000) / 1000;
        const currentStock = mat ? Number(mat.current_stock) : 0;
        return {
          material_id: r.material_id,
          material_name: mat ? mat.material_name : 'Unknown',
          unit: mat ? mat.unit : 'unit',
          qty_per_meter: Number(r.qty_per_meter),
          needed_qty: needed,
          current_stock: currentStock,
          unit_cost: mat ? Number(mat.unit_cost) : 0,
          is_short: currentStock < needed
        };
      });

      const movements = db.where('stock_movements', m => m.production_id == po.production_id);
      const stockMovements = movements.map(m => {
        const mat = db.find('materials', m.material_id);
        return Object.assign({}, m, { material: mat });
      });

      const totalMaterialCost = stockMovements.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
      const isOverdue = po.status !== 'Completed' && po.due_date && po.due_date < utils.getTodayDate();

      return Object.assign({}, po, {
        item,
        order,
        customer,
        product,
        stages,
        required_materials: requiredMaterials,
        stock_movements: stockMovements,
        total_material_cost: totalMaterialCost,
        is_overdue: isOverdue
      });
    },

    /**
     * Start Production (PRD 6.3):
     * Re-check stock for this PO's item. If not enough -> block start.
     * If enough -> insert stock_movements (OUT), reduce materials.current_stock,
     * set PO to 'In Progress', set parent order to 'In Production',
     * set first stage (Thread Preparation) to 'In Progress' with timestamp and user.
     */
    startProduction: function(productionId, userId) {
      const po = db.find('production_orders', productionId);
      if (!po) {
        return { success: false, error: 'Production order not found.' };
      }
      if (po.status !== 'Waiting') {
        return { success: false, error: `Cannot start production for order in status "${po.status}". Must be "Waiting".` };
      }

      const item = db.find('order_items', po.item_id);
      if (!item) {
        return { success: false, error: 'Linked order item not found.' };
      }

      const product = db.find('products', item.product_id);
      if (!product) {
        return { success: false, error: 'Product not found.' };
      }

      // Check stock availability right now
      const reqs = db.where('material_requirements', r => r.product_id == product.product_id);
      const shortList = [];
      const deductions = [];

      reqs.forEach(r => {
        const mat = db.find('materials', r.material_id);
        const needed = Math.round((Number(item.quantity_m) * Number(r.qty_per_meter)) * 1000) / 1000;
        const currentStock = mat ? Number(mat.current_stock) : 0;
        if (currentStock < needed) {
          shortList.push(`${mat ? mat.material_name : 'Material'}: needed ${needed} ${mat ? mat.unit : ''}, available ${currentStock} ${mat ? mat.unit : ''}`);
        } else {
          deductions.push({
            material: mat,
            needed_qty: needed,
            unit_cost: mat ? Number(mat.unit_cost) : 0,
            total_cost: Math.round(needed * Number(mat.unit_cost))
          });
        }
      });

      if (shortList.length > 0) {
        return {
          success: false,
          error: `Cannot start production! Insufficient stock: ${shortList.join('; ')}`
        };
      }

      const today = utils.getTodayDate();
      const now = utils.getNowDateTime();

      // Deduct stock and insert OUT movements
      deductions.forEach(d => {
        // 1. Insert stock_movements (OUT)
        db.insert('stock_movements', {
          material_id: d.material.material_id,
          production_id: po.production_id,
          movement_type: 'OUT',
          quantity: d.needed_qty,
          total_cost: d.total_cost,
          movement_date: today,
          note: `Production ${po.production_code}`
        });

        // 2. Reduce materials.current_stock
        const newStock = Math.round((Number(d.material.current_stock) - d.needed_qty) * 1000) / 1000;
        db.update('materials', d.material.material_id, {
          current_stock: newStock
        });
      });

      // Update production order status
      db.update('production_orders', po.production_id, {
        status: 'In Progress',
        start_date: today
      });

      // Update parent order status to 'In Production'
      if (item.order_id) {
        db.update('orders', item.order_id, {
          status: 'In Production'
        });
      }

      // Update first stage (Thread Preparation) to 'In Progress'
      const stages = db.where('production_stages', s => s.production_id == po.production_id)
        .sort((a, b) => a.stage_id - b.stage_id);

      if (stages.length > 0) {
        const firstStage = stages[0];
        db.update('production_stages', firstStage.stage_id, {
          status: 'In Progress',
          started_at: now,
          user_id: Number(userId) || null
        });
      }

      return {
        success: true,
        productionOrder: this.getProductionOrder(po.production_id)
      };
    },

    /**
     * Advance stage one step in fixed order (PRD 6.4):
     * Thread Preparation -> Dyeing -> Weaving -> Finishing
     */
    advanceStage: function(productionId, userId) {
      const po = db.find('production_orders', productionId);
      if (!po || po.status !== 'In Progress') {
        return { success: false, error: 'Production order must be "In Progress" to advance stage.' };
      }

      const stages = db.where('production_stages', s => s.production_id == po.production_id)
        .sort((a, b) => a.stage_id - b.stage_id);

      const inProgressIndex = stages.findIndex(s => s.status === 'In Progress');
      if (inProgressIndex === -1) {
        return { success: false, error: 'No stage currently In Progress.' };
      }

      const currentStage = stages[inProgressIndex];
      const now = utils.getNowDateTime();

      // If current stage is the last stage (Finishing), caller should use confirmFinishedGoods
      if (inProgressIndex === stages.length - 1) {
        return {
          success: false,
          error: 'Finishing is the final stage. Please confirm finished goods with quantity and quality note.'
        };
      }

      // Mark current stage as Done
      db.update('production_stages', currentStage.stage_id, {
        status: 'Done',
        finished_at: now,
        user_id: Number(userId) || currentStage.user_id
      });

      // Start next stage
      const nextStage = stages[inProgressIndex + 1];
      db.update('production_stages', nextStage.stage_id, {
        status: 'In Progress',
        started_at: now,
        user_id: Number(userId) || null
      });

      return {
        success: true,
        completedStage: currentStage.stage_name,
        nextStage: nextStage.stage_name,
        productionOrder: this.getProductionOrder(productionId)
      };
    },

    /**
     * Confirm finished goods (PRD 6.5):
     * Finishing is done -> enter qty_finished and quality_note
     * Sets PO to 'Completed', marks Finishing stage 'Done'
     * Production cost = SUM(OUT movements) -> inserts finance_transactions (PRODUCTION_COST)
     * If all POs of order are Completed -> Order status -> 'Ready for Delivery' and automatic Invoice created (Unpaid).
     */
    confirmFinishedGoods: function(data) {
      const { production_id, qty_finished, quality_note, user_id } = data;

      const po = db.find('production_orders', production_id);
      if (!po) {
        return { success: false, error: 'Production order not found.' };
      }
      if (po.status === 'Completed') {
        return { success: false, error: 'Production order is already completed.' };
      }

      const qty = Number(qty_finished);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: 'Finished quantity in meters must be greater than 0.' };
      }

      const item = db.find('order_items', po.item_id);
      const order = item ? db.find('orders', item.order_id) : null;
      if (!order) {
        return { success: false, error: 'Parent order not found.' };
      }

      const now = utils.getNowDateTime();
      const today = utils.getTodayDate();

      // 1. Mark Finishing stage as Done
      const stages = db.where('production_stages', s => s.production_id == po.production_id)
        .sort((a, b) => a.stage_id - b.stage_id);
      const finishingStage = stages.find(s => s.stage_name === 'Finishing');
      if (finishingStage) {
        db.update('production_stages', finishingStage.stage_id, {
          status: 'Done',
          finished_at: now,
          user_id: Number(user_id) || finishingStage.user_id
        });
      }

      // 2. Update production order status to Completed
      db.update('production_orders', po.production_id, {
        status: 'Completed',
        qty_finished: qty,
        quality_note: quality_note ? quality_note.trim() : 'Passed inspection'
      });

      // 3. Calculate production cost (sum of OUT movements for this PO)
      const movements = db.where('stock_movements', m => m.production_id == po.production_id && m.movement_type === 'OUT');
      const totalProductionCost = movements.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);

      // 4. Insert finance_transactions (PRODUCTION_COST)
      db.insert('finance_transactions', {
        payment_id: null,
        production_id: po.production_id,
        movement_id: null,
        trx_type: 'PRODUCTION_COST',
        amount: totalProductionCost,
        trx_date: today,
        description: `Production cost for ${po.production_code}`
      });

      // 5. Check if all production orders for this order are completed
      const orderItems = db.where('order_items', it => it.order_id == order.order_id);
      const itemIds = orderItems.map(it => it.item_id);
      const allOrderPos = db.where('production_orders', p => itemIds.includes(p.item_id));

      const allCompleted = allOrderPos.every(p =>
        p.production_id == po.production_id ? true : p.status === 'Completed'
      );

      let createdInvoice = null;
      if (allCompleted) {
        // Update order status to 'Ready for Delivery'
        db.update('orders', order.order_id, {
          status: 'Ready for Delivery'
        });

        // Automatically create Invoice if not already created
        const existingInvoice = db.where('invoices', inv => inv.order_id == order.order_id)[0];
        if (!existingInvoice) {
          const invCode = db.nextCode('INV-', 'invoices');
          createdInvoice = db.insert('invoices', {
            invoice_code: invCode,
            order_id: order.order_id,
            invoice_date: today,
            total_amount: Number(order.total_amount),
            status: 'Unpaid'
          });
        }
      }

      return {
        success: true,
        productionOrder: this.getProductionOrder(po.production_id),
        orderReadyForDelivery: allCompleted,
        invoice: createdInvoice
      };
    }
  };

  window.productionService = productionService;
})(window);
