/**
 * Seed data for Endek Ayuwindy Bali ERP Prototype
 * Contains initial users, materials, products, recipes, customers, and history
 */

window.SEED_DATA = {
  tables: {
    users: [
      { user_id: 1, name: 'Owner Ayuwindy', username: 'owner', password: 'owner123', role: 'Owner' },
      { user_id: 2, name: 'Admin Ayu', username: 'admin', password: 'admin123', role: 'Admin' },
      { user_id: 3, name: 'Supervisor Wayan', username: 'supervisor', password: 'supervisor123', role: 'Supervisor' }
    ],

    customers: [
      { customer_id: 1, name: 'Toko Oleh-Oleh Krisna Singaraja', phone: '081234567890', address: 'Jl. Diponegoro No. 12, Singaraja', customer_type: 'Souvenir Shop' },
      { customer_id: 2, name: 'Kutus Kutus Oleh-Oleh Bali', phone: '081338877665', address: 'Jl. Ahmad Yani No. 45, Singaraja', customer_type: 'Souvenir Shop' },
      { customer_id: 3, name: 'Puri Bagus Lovina Resort', phone: '081999112233', address: 'Jl. Raya Lovina, Kalibukbuk, Buleleng', customer_type: 'Hotel' },
      { customer_id: 4, name: 'Homestay Sari Nadi Munduk', phone: '085237445566', address: 'Jl. Desa Munduk, Banjar, Buleleng', customer_type: 'Homestay' },
      { customer_id: 5, name: 'Ibu Luh Putu Ariani', phone: '087860112244', address: 'Jl. Ngurah Rai No. 88, Singaraja', customer_type: 'Individual' }
    ],

    materials: [
      { material_id: 1, material_name: 'Cotton Thread', material_type: 'Thread', unit: 'kg', current_stock: 25, min_stock: 10, unit_cost: 80000 },
      { material_id: 2, material_name: 'Red Dye', material_type: 'Dye', unit: 'kg', current_stock: 4.8, min_stock: 2, unit_cost: 150000 },
      { material_id: 3, material_name: 'Indigo Dye', material_type: 'Dye', unit: 'kg', current_stock: 5.375, min_stock: 6, unit_cost: 175000 },
      { material_id: 4, material_name: 'Yellow Dye', material_type: 'Dye', unit: 'kg', current_stock: 6, min_stock: 2, unit_cost: 140000 },
      { material_id: 5, material_name: 'Black Dye', material_type: 'Dye', unit: 'kg', current_stock: 8, min_stock: 3, unit_cost: 130000 }
    ],

    products: [
      { product_id: 1, product_name: 'Endek Cepuk Merah', motif: 'Cepuk', color: 'Red', price_per_meter: 250000 },
      { product_id: 2, product_name: 'Endek Sekar Jagat Biru', motif: 'Sekar Jagat', color: 'Indigo', price_per_meter: 275000 },
      { product_id: 3, product_name: 'Endek Wangsul Kuning', motif: 'Wangsul', color: 'Yellow', price_per_meter: 260000 },
      { product_id: 4, product_name: 'Endek Bali Hitam', motif: 'Plain / Songket-style', color: 'Black', price_per_meter: 230000 }
    ],

    material_requirements: [
      { req_id: 1, product_id: 1, material_id: 1, qty_per_meter: 0.2 },
      { req_id: 2, product_id: 1, material_id: 2, qty_per_meter: 0.02 },
      { req_id: 3, product_id: 2, material_id: 1, qty_per_meter: 0.2 },
      { req_id: 4, product_id: 2, material_id: 3, qty_per_meter: 0.02 },
      { req_id: 5, product_id: 3, material_id: 1, qty_per_meter: 0.2 },
      { req_id: 6, product_id: 3, material_id: 4, qty_per_meter: 0.02 },
      { req_id: 7, product_id: 4, material_id: 1, qty_per_meter: 0.2 },
      { req_id: 8, product_id: 4, material_id: 5, qty_per_meter: 0.02 }
    ],

    orders: [
      {
        order_id: 1,
        order_code: 'SO-001',
        customer_id: 3,
        order_date: '2026-10-02',
        due_date: '2026-10-15',
        status: 'Completed',
        total_amount: 2300000
      },
      {
        order_id: 2,
        order_code: 'SO-002',
        customer_id: 1,
        order_date: '2026-10-08',
        due_date: '2026-10-22',
        status: 'Completed',
        total_amount: 3900000
      },
      {
        order_id: 3,
        order_code: 'SO-003',
        customer_id: 4,
        order_date: '2026-10-20',
        due_date: '2026-11-04',
        status: 'In Production',
        total_amount: 3300000
      },
      {
        order_id: 4,
        order_code: 'SO-004',
        customer_id: 5,
        order_date: '2026-10-18',
        due_date: '2026-10-28',
        status: 'Ready for Delivery',
        total_amount: 2000000
      }
    ],

    order_items: [
      { item_id: 1, order_id: 1, product_id: 4, size: 'Standard (2.5m x 1.05m)', quantity_m: 10, unit_price: 230000 },
      { item_id: 2, order_id: 2, product_id: 3, size: 'Standard (2.5m x 1.05m)', quantity_m: 15, unit_price: 260000 },
      { item_id: 3, order_id: 3, product_id: 2, size: 'Standard (2.5m x 1.05m)', quantity_m: 12, unit_price: 275000 },
      { item_id: 4, order_id: 4, product_id: 1, size: 'Standard (2.5m x 1.05m)', quantity_m: 8, unit_price: 250000 }
    ],

    deliveries: [
      { delivery_id: 1, order_id: 1, delivery_date: '2026-10-15', status: 'Delivered', notes: 'Handover to resort manager at Puri Bagus Lovina' },
      { delivery_id: 2, order_id: 2, delivery_date: '2026-10-21', status: 'Delivered', notes: 'Delivered to Toko Krisna Singaraja warehouse' }
    ],

    stock_movements: [
      { movement_id: 1, material_id: 1, production_id: 1, movement_type: 'OUT', quantity: 2, total_cost: 160000, movement_date: '2026-10-03', note: 'Production PO-001' },
      { movement_id: 2, material_id: 5, production_id: 1, movement_type: 'OUT', quantity: 0.2, total_cost: 26000, movement_date: '2026-10-03', note: 'Production PO-001' },
      { movement_id: 3, material_id: 1, production_id: 2, movement_type: 'OUT', quantity: 3, total_cost: 240000, movement_date: '2026-10-09', note: 'Production PO-002' },
      { movement_id: 4, material_id: 4, production_id: 2, movement_type: 'OUT', quantity: 0.3, total_cost: 42000, movement_date: '2026-10-09', note: 'Production PO-002' },
      { movement_id: 5, material_id: 1, production_id: 3, movement_type: 'OUT', quantity: 2.4, total_cost: 192000, movement_date: '2026-10-21', note: 'Production PO-003' },
      { movement_id: 6, material_id: 3, production_id: 3, movement_type: 'OUT', quantity: 0.24, total_cost: 42000, movement_date: '2026-10-21', note: 'Production PO-003' },
      { movement_id: 7, material_id: 1, production_id: 4, movement_type: 'OUT', quantity: 1.6, total_cost: 128000, movement_date: '2026-10-19', note: 'Production PO-004' },
      { movement_id: 8, material_id: 2, production_id: 4, movement_type: 'OUT', quantity: 0.16, total_cost: 24000, movement_date: '2026-10-19', note: 'Production PO-004' }
    ],

    production_orders: [
      {
        production_id: 1,
        production_code: 'PO-001',
        item_id: 1,
        status: 'Completed',
        start_date: '2026-10-03',
        due_date: '2026-10-15',
        qty_finished: 10,
        quality_note: 'Fine weave, passed QC standards'
      },
      {
        production_id: 2,
        production_code: 'PO-002',
        item_id: 2,
        status: 'Completed',
        start_date: '2026-10-09',
        due_date: '2026-10-22',
        qty_finished: 15,
        quality_note: 'Vibrant yellow motif, excellent finish'
      },
      {
        production_id: 3,
        production_code: 'PO-003',
        item_id: 3,
        status: 'In Progress',
        start_date: '2026-10-21',
        due_date: '2026-11-04',
        qty_finished: null,
        quality_note: null
      },
      {
        production_id: 4,
        production_code: 'PO-004',
        item_id: 4,
        status: 'Completed',
        start_date: '2026-10-19',
        due_date: '2026-10-28',
        qty_finished: 8,
        quality_note: 'Traditional Cepuk red hue verified'
      }
    ],

    production_stages: [
      // PO-001 stages
      { stage_id: 1, production_id: 1, user_id: 3, stage_name: 'Thread Preparation', status: 'Done', started_at: '2026-10-03T08:00:00', finished_at: '2026-10-04T12:00:00' },
      { stage_id: 2, production_id: 1, user_id: 3, stage_name: 'Dyeing', status: 'Done', started_at: '2026-10-04T13:00:00', finished_at: '2026-10-06T15:00:00' },
      { stage_id: 3, production_id: 1, user_id: 3, stage_name: 'Weaving', status: 'Done', started_at: '2026-10-07T08:00:00', finished_at: '2026-10-12T17:00:00' },
      { stage_id: 4, production_id: 1, user_id: 3, stage_name: 'Finishing', status: 'Done', started_at: '2026-10-13T09:00:00', finished_at: '2026-10-14T11:00:00' },

      // PO-002 stages
      { stage_id: 5, production_id: 2, user_id: 3, stage_name: 'Thread Preparation', status: 'Done', started_at: '2026-10-09T08:00:00', finished_at: '2026-10-10T11:00:00' },
      { stage_id: 6, production_id: 2, user_id: 3, stage_name: 'Dyeing', status: 'Done', started_at: '2026-10-10T13:00:00', finished_at: '2026-10-12T16:00:00' },
      { stage_id: 7, production_id: 2, user_id: 3, stage_name: 'Weaving', status: 'Done', started_at: '2026-10-13T08:00:00', finished_at: '2026-10-19T17:00:00' },
      { stage_id: 8, production_id: 2, user_id: 3, stage_name: 'Finishing', status: 'Done', started_at: '2026-10-20T08:30:00', finished_at: '2026-10-21T10:00:00' },

      // PO-003 stages (Weaving In Progress)
      { stage_id: 9, production_id: 3, user_id: 3, stage_name: 'Thread Preparation', status: 'Done', started_at: '2026-10-21T08:00:00', finished_at: '2026-10-22T10:00:00' },
      { stage_id: 10, production_id: 3, user_id: 3, stage_name: 'Dyeing', status: 'Done', started_at: '2026-10-22T11:00:00', finished_at: '2026-10-24T15:00:00' },
      { stage_id: 11, production_id: 3, user_id: 3, stage_name: 'Weaving', status: 'In Progress', started_at: '2026-10-25T08:00:00', finished_at: null },
      { stage_id: 12, production_id: 3, user_id: null, stage_name: 'Finishing', status: 'Pending', started_at: null, finished_at: null },

      // PO-004 stages
      { stage_id: 13, production_id: 4, user_id: 3, stage_name: 'Thread Preparation', status: 'Done', started_at: '2026-10-19T08:00:00', finished_at: '2026-10-20T09:00:00' },
      { stage_id: 14, production_id: 4, user_id: 3, stage_name: 'Dyeing', status: 'Done', started_at: '2026-10-20T10:00:00', finished_at: '2026-10-22T14:00:00' },
      { stage_id: 15, production_id: 4, user_id: 3, stage_name: 'Weaving', status: 'Done', started_at: '2026-10-23T08:00:00', finished_at: '2026-10-25T16:00:00' },
      { stage_id: 16, production_id: 4, user_id: 3, stage_name: 'Finishing', status: 'Done', started_at: '2026-10-26T08:00:00', finished_at: '2026-10-26T10:30:00' }
    ],

    invoices: [
      { invoice_id: 1, invoice_code: 'INV-001', order_id: 1, invoice_date: '2026-10-14', total_amount: 2300000, status: 'Paid' },
      { invoice_id: 2, invoice_code: 'INV-002', order_id: 2, invoice_date: '2026-10-21', total_amount: 3900000, status: 'Paid' },
      { invoice_id: 3, invoice_code: 'INV-003', order_id: 4, invoice_date: '2026-10-26', total_amount: 2000000, status: 'Unpaid' }
    ],

    payments: [
      { payment_id: 1, invoice_id: 1, payment_date: '2026-10-16', amount: 2300000, method: 'Bank Transfer' },
      { payment_id: 2, invoice_id: 2, payment_date: '2026-10-22', amount: 3900000, method: 'Bank Transfer' }
    ],

    finance_transactions: [
      { trx_id: 1, payment_id: null, production_id: 1, movement_id: null, trx_type: 'PRODUCTION_COST', amount: 186000, trx_date: '2026-10-14', description: 'Production cost for PO-001' },
      { trx_id: 2, payment_id: 1, production_id: null, movement_id: null, trx_type: 'INCOME', amount: 2300000, trx_date: '2026-10-16', description: 'Payment for INV-001 (Bank Transfer)' },
      { trx_id: 3, payment_id: null, production_id: 2, movement_id: null, trx_type: 'PRODUCTION_COST', amount: 282000, trx_date: '2026-10-21', description: 'Production cost for PO-002' },
      { trx_id: 4, payment_id: 2, production_id: null, movement_id: null, trx_type: 'INCOME', amount: 3900000, trx_date: '2026-10-22', description: 'Payment for INV-002 (Bank Transfer)' },
      { trx_id: 5, payment_id: null, production_id: 4, movement_id: null, trx_type: 'PRODUCTION_COST', amount: 152000, trx_date: '2026-10-26', description: 'Production cost for PO-004' }
    ]
  },

  counters: {
    users: 3,
    customers: 5,
    materials: 5,
    products: 4,
    material_requirements: 8,
    orders: 4,
    order_items: 4,
    deliveries: 2,
    stock_movements: 8,
    production_orders: 4,
    production_stages: 16,
    invoices: 3,
    payments: 2,
    finance_transactions: 5
  }
};
