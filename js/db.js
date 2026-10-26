/**
 * Data Layer (localStorage) for Endek Ayuwindy Bali ERP Prototype
 * All tables stored with prefix erp_endek_
 */

(function(window) {
  'use strict';

  const PREFIX = 'erp_endek_';

  const PK_MAP = {
    users: 'user_id',
    customers: 'customer_id',
    products: 'product_id',
    orders: 'order_id',
    order_items: 'item_id',
    deliveries: 'delivery_id',
    materials: 'material_id',
    material_requirements: 'req_id',
    stock_movements: 'movement_id',
    production_orders: 'production_id',
    production_stages: 'stage_id',
    invoices: 'invoice_id',
    payments: 'payment_id',
    finance_transactions: 'trx_id'
  };

  const db = {
    /**
     * Get primary key field name for a table
     */
    getPk: function(table) {
      return PK_MAP[table] || (table.endsWith('s') ? table.slice(0, -1) + '_id' : 'id');
    },

    /**
     * Return all records in a table
     */
    all: function(table) {
      try {
        const raw = localStorage.getItem(PREFIX + table);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error(`Error reading table ${table} from localStorage:`, e);
        return [];
      }
    },

    /**
     * Find a single record by primary key ID
     */
    find: function(table, id) {
      if (id === undefined || id === null) return null;
      const pk = this.getPk(table);
      const records = this.all(table);
      const found = records.find(r => r[pk] == id || r.id == id);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },

    /**
     * Return records matching a predicate function
     */
    where: function(table, predicateFn) {
      const records = this.all(table);
      return records.filter(predicateFn).map(r => JSON.parse(JSON.stringify(r)));
    },

    /**
     * Insert a record with auto-increment ID
     */
    insert: function(table, record) {
      const pk = this.getPk(table);
      const records = this.all(table);
      
      // Get or initialize counters
      let counters = {};
      try {
        const rawCounters = localStorage.getItem(PREFIX + 'counters');
        counters = rawCounters ? JSON.parse(rawCounters) : {};
      } catch (e) {
        counters = {};
      }

      let currentMax = counters[table] || 0;
      records.forEach(r => {
        if (r[pk] && r[pk] > currentMax) currentMax = r[pk];
      });

      const nextId = currentMax + 1;
      counters[table] = nextId;

      const newRecord = Object.assign({}, record);
      newRecord[pk] = nextId;

      records.push(newRecord);

      localStorage.setItem(PREFIX + table, JSON.stringify(records));
      localStorage.setItem(PREFIX + 'counters', JSON.stringify(counters));

      return JSON.parse(JSON.stringify(newRecord));
    },

    /**
     * Update an existing record by primary key ID
     */
    update: function(table, id, changes) {
      const pk = this.getPk(table);
      const records = this.all(table);
      const index = records.findIndex(r => r[pk] == id || r.id == id);

      if (index === -1) {
        console.warn(`Record not found in ${table} with id ${id}`);
        return null;
      }

      records[index] = Object.assign({}, records[index], changes);
      localStorage.setItem(PREFIX + table, JSON.stringify(records));

      return JSON.parse(JSON.stringify(records[index]));
    },

    /**
     * Delete an existing record by primary key ID
     */
    delete: function(table, id) {
      const pk = this.getPk(table);
      let records = this.all(table);
      records = records.filter(r => r[pk] != id && r.id != id);
      localStorage.setItem(PREFIX + table, JSON.stringify(records));
      return true;
    },

    /**
     * Generate next human-readable code e.g. SO-005, PO-005, INV-004
     */
    nextCode: function(prefix, table) {
      let counters = {};
      try {
        const rawCounters = localStorage.getItem(PREFIX + 'counters');
        counters = rawCounters ? JSON.parse(rawCounters) : {};
      } catch (e) {
        counters = {};
      }

      const records = this.all(table);
      const pk = this.getPk(table);
      let currentMax = counters[table] || 0;
      records.forEach(r => {
        if (r[pk] && r[pk] > currentMax) currentMax = r[pk];
      });

      const nextNum = currentMax + 1;
      return `${prefix}${String(nextNum).padStart(3, '0')}`;
    },

    /**
     * Check if database is empty / not seeded
     */
    seedIfEmpty: function() {
      const seeded = localStorage.getItem(PREFIX + 'seeded');
      if (!seeded || !localStorage.getItem(PREFIX + 'users')) {
        this.reset();
      }
    },

    /**
     * Reset all erp_endek_* localStorage data and reload seed data
     */
    reset: function() {
      // Clear all keys with prefix
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Reload seed data if available
      if (window.SEED_DATA) {
        Object.keys(window.SEED_DATA.tables).forEach(table => {
          localStorage.setItem(PREFIX + table, JSON.stringify(window.SEED_DATA.tables[table]));
        });
        localStorage.setItem(PREFIX + 'counters', JSON.stringify(window.SEED_DATA.counters));
        localStorage.setItem(PREFIX + 'seeded', 'true');
      }
    }
  };

  window.db = db;
})(window);
