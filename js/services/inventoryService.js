/**
 * Inventory Service - Business rules and logic for Materials, Stock In, Stock Card, and Stock Adjustment
 */

(function(window) {
  'use strict';

  const inventoryService = {
    /**
     * Get all materials with low-stock status calculation
     */
    getMaterials: function() {
      const list = db.all('materials');
      return list.map(m => {
        const current = Number(m.current_stock);
        const min = Number(m.min_stock);
        return Object.assign({}, m, {
          current_stock: current,
          min_stock: min,
          unit_cost: Number(m.unit_cost),
          is_low: current <= min
        });
      });
    },

    getMaterial: function(id) {
      const m = db.find('materials', id);
      if (!m) return null;
      const current = Number(m.current_stock);
      const min = Number(m.min_stock);
      return Object.assign({}, m, {
        current_stock: current,
        min_stock: min,
        unit_cost: Number(m.unit_cost),
        is_low: current <= min
      });
    },

    /**
     * Create or edit material
     */
    saveMaterial: function(data) {
      if (!data.material_name || !data.material_name.trim()) {
        return { success: false, error: 'Material name is required.' };
      }
      if (!data.material_type) {
        return { success: false, error: 'Material type is required.' };
      }
      if (!data.unit || !data.unit.trim()) {
        return { success: false, error: 'Unit (e.g. kg, meter) is required.' };
      }

      const current_stock = Number(data.current_stock) || 0;
      const min_stock = Number(data.min_stock) || 0;
      const unit_cost = Number(data.unit_cost) || 0;

      if (data.material_id) {
        const updated = db.update('materials', data.material_id, {
          material_name: data.material_name.trim(),
          material_type: data.material_type,
          unit: data.unit.trim(),
          min_stock: min_stock,
          unit_cost: unit_cost
        });
        return { success: true, material: updated };
      } else {
        const inserted = db.insert('materials', {
          material_name: data.material_name.trim(),
          material_type: data.material_type,
          unit: data.unit.trim(),
          current_stock: current_stock,
          min_stock: min_stock,
          unit_cost: unit_cost
        });
        return { success: true, material: inserted };
      }
    },

    /**
     * Stock In (PRD 6.8):
     * Choose material, enter quantity and total cost
     * Insert stock_movements (IN), increase current_stock, update unit_cost
     * Insert finance_transactions (MATERIAL_PURCHASE)
     */
    stockIn: function(stockInData) {
      const { material_id, quantity, total_cost, note, movement_date } = stockInData;

      if (!material_id) {
        return { success: false, error: 'Material must be selected.' };
      }

      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: 'Quantity must be a positive number greater than 0.' };
      }

      const cost = Number(total_cost);
      if (isNaN(cost) || cost <= 0) {
        return { success: false, error: 'Total cost must be a positive number greater than 0.' };
      }

      const material = db.find('materials', material_id);
      if (!material) {
        return { success: false, error: 'Material not found.' };
      }

      const date = movement_date || utils.getTodayDate();
      const unitCost = Math.round((cost / qty) * 100) / 100;

      // 1. Insert stock_movements (type IN)
      const movement = db.insert('stock_movements', {
        material_id: Number(material_id),
        production_id: null,
        movement_type: 'IN',
        quantity: qty,
        total_cost: cost,
        movement_date: date,
        note: note ? note.trim() : `Stock In: ${qty} ${material.unit}`
      });

      // 2. Increase current_stock and update unit_cost
      const updatedStock = Math.round((Number(material.current_stock) + qty) * 1000) / 1000;
      const updatedMaterial = db.update('materials', material_id, {
        current_stock: updatedStock,
        unit_cost: unitCost
      });

      // 3. Insert finance_transactions (type MATERIAL_PURCHASE)
      db.insert('finance_transactions', {
        payment_id: null,
        production_id: null,
        movement_id: movement.movement_id,
        trx_type: 'MATERIAL_PURCHASE',
        amount: cost,
        trx_date: date,
        description: `Material Purchase: ${qty} ${material.unit} of ${material.material_name} @ ${utils.formatRupiah(unitCost)}/${material.unit}`
      });

      return {
        success: true,
        movement: movement,
        material: updatedMaterial
      };
    },

    /**
     * Stock Count / Adjustment (PRD 6.9):
     * Real quantity counted vs system stock -> save ADJUSTMENT movement, set current_stock = real_quantity
     */
    stockCountAdjustment: function(adjData) {
      const { material_id, real_quantity, note, movement_date } = adjData;

      if (!material_id) {
        return { success: false, error: 'Material must be selected.' };
      }

      const realQty = Number(real_quantity);
      if (isNaN(realQty) || realQty < 0) {
        return { success: false, error: 'Real counted quantity must be a non-negative number (>= 0).' };
      }

      if (!note || !note.trim()) {
        return { success: false, error: 'A short note explaining the reason for adjustment is required.' };
      }

      const material = db.find('materials', material_id);
      if (!material) {
        return { success: false, error: 'Material not found.' };
      }

      const currentQty = Number(material.current_stock);
      const diff = Math.round((realQty - currentQty) * 1000) / 1000;

      const date = movement_date || utils.getTodayDate();

      // Insert stock_movements (type ADJUSTMENT, quantity = diff)
      const movement = db.insert('stock_movements', {
        material_id: Number(material_id),
        production_id: null,
        movement_type: 'ADJUSTMENT',
        quantity: diff,
        total_cost: Math.round(Math.abs(diff) * Number(material.unit_cost)),
        movement_date: date,
        note: note.trim()
      });

      // Update current_stock to real counted quantity
      const updatedMaterial = db.update('materials', material_id, {
        current_stock: realQty
      });

      return {
        success: true,
        movement: movement,
        material: updatedMaterial,
        diff: diff
      };
    },

    /**
     * Get stock card ledger for a single material (PRD 7.4)
     */
    getStockCard: function(materialId) {
      const material = this.getMaterial(materialId);
      if (!material) return null;

      const movements = db.where('stock_movements', m => m.material_id == materialId)
        .sort((a, b) => {
          if (a.movement_date !== b.movement_date) {
            return a.movement_date.localeCompare(b.movement_date);
          }
          return a.movement_id - b.movement_id;
        });

      // Calculate running balances
      // To ensure running balance lands on current_stock:
      // Total net movement = sum(IN) - sum(OUT) + sum(ADJUSTMENT)
      // Base stock before recorded movements = current_stock - net
      let net = 0;
      movements.forEach(m => {
        if (m.movement_type === 'IN') net += Number(m.quantity);
        else if (m.movement_type === 'OUT') net -= Number(m.quantity);
        else if (m.movement_type === 'ADJUSTMENT') net += Number(m.quantity);
      });

      let running = Math.round((material.current_stock - net) * 1000) / 1000;
      const history = movements.map(m => {
        const qty = Number(m.quantity);
        if (m.movement_type === 'IN') {
          running += qty;
        } else if (m.movement_type === 'OUT') {
          running -= qty;
        } else if (m.movement_type === 'ADJUSTMENT') {
          running += qty;
        }
        running = Math.round(running * 1000) / 1000;

        let linkedPoCode = '-';
        if (m.production_id) {
          const po = db.find('production_orders', m.production_id);
          if (po) linkedPoCode = po.production_code;
        }

        return Object.assign({}, m, {
          running_balance: running,
          linked_po_code: linkedPoCode
        });
      });

      return {
        material: material,
        history: history.reverse() // show latest first for display
      };
    },

    /**
     * Get list of recent Stock In movements
     */
    getStockInHistory: function() {
      const movements = db.where('stock_movements', m => m.movement_type === 'IN')
        .sort((a, b) => b.movement_id - a.movement_id);

      return movements.map(m => {
        const mat = db.find('materials', m.material_id);
        return Object.assign({}, m, { material: mat });
      });
    },

    /**
     * Get count and list of low stock materials
     */
    getLowStockMaterials: function() {
      return this.getMaterials().filter(m => m.is_low);
    }
  };

  window.inventoryService = inventoryService;
})(window);
