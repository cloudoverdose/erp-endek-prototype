/**
 * Sales Module Page Views: Customers, Orders List, New Custom Order with Live Stock Check, Order Detail with Traceability, and Deliveries
 */

(function(window) {
  'use strict';

  // ==========================================
  // 1. CUSTOMERS VIEW (#/sales/customers)
  // ==========================================
  window.pageSalesCustomers = function(params, container) {
    function render(searchQuery = '') {
      const customers = salesService.getCustomers(searchQuery);

      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold text-dark mb-1">Customer Directory</h2>
            <p class="text-muted small mb-0">Manage souvenir shops, resorts, homestays, and individual buyers</p>
          </div>
          <button class="btn btn-terracotta" id="btn-add-customer">
            <i class="bi bi-person-plus-fill me-1"></i> Add New Customer
          </button>
        </div>

        <div class="card-custom">
          <div class="card-header-custom">
            <div class="input-group" style="max-width: 320px;">
              <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control border-start-0 ps-0" id="customer-search-input" placeholder="Search by name, phone, type..." value="${searchQuery}">
            </div>
            <span class="text-muted small">${customers.length} customer(s) found</span>
          </div>
          <div class="table-responsive">
            <table class="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Customer Type</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${customers.length === 0 ? `
                  <tr>
                    <td colspan="5" class="text-center py-4 text-muted">No customers found matching search.</td>
                  </tr>
                ` : customers.map(c => `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>
                      <span class="badge ${
                        c.customer_type === 'Hotel' ? 'bg-primary' :
                        c.customer_type === 'Souvenir Shop' ? 'bg-info text-dark' :
                        c.customer_type === 'Homestay' ? 'bg-warning text-dark' : 'bg-secondary'
                      }">
                        ${c.customer_type}
                      </span>
                    </td>
                    <td><i class="bi bi-telephone me-1 text-muted"></i>${c.phone}</td>
                    <td><small class="text-muted">${c.address}</small></td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-secondary edit-customer-btn" data-id="${c.customer_id}">
                        <i class="bi bi-pencil"></i> Edit
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Customer Modal -->
        <div class="modal fade" id="customerModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content shadow border-0">
              <div class="modal-header">
                <h5 class="modal-title fw-bold" id="customerModalTitle">Add Customer</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <form id="customer-form">
                <div class="modal-body">
                  <div id="customer-form-error"></div>
                  <input type="hidden" id="cust-id">
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Customer Name *</label>
                    <input type="text" class="form-control" id="cust-name" required placeholder="e.g. Toko Krisna Singaraja">
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Customer Type *</label>
                    <select class="form-select" id="cust-type" required>
                      <option value="Souvenir Shop">Souvenir Shop</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Homestay">Homestay</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Phone Number *</label>
                    <input type="text" class="form-control" id="cust-phone" required placeholder="08xxxxxxxxxx">
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Address *</label>
                    <textarea class="form-control" id="cust-address" rows="2" placeholder="Singaraja / Buleleng, Bali"></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary-custom">Save Customer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      // Search Listener
      const searchInput = document.getElementById('customer-search-input');
      searchInput.addEventListener('input', function() {
        render(this.value);
      });

      // Modal setup
      const modalEl = document.getElementById('customerModal');
      const bsModal = new window.bootstrap.Modal(modalEl);

      document.getElementById('btn-add-customer').addEventListener('click', function() {
        document.getElementById('customerModalTitle').textContent = 'Add New Customer';
        document.getElementById('cust-id').value = '';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-form-error').innerHTML = '';
        bsModal.show();
      });

      container.querySelectorAll('.edit-customer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          const cust = salesService.getCustomer(id);
          if (cust) {
            document.getElementById('customerModalTitle').textContent = 'Edit Customer';
            document.getElementById('cust-id').value = cust.customer_id;
            document.getElementById('cust-name').value = cust.name;
            document.getElementById('cust-type').value = cust.customer_type;
            document.getElementById('cust-phone').value = cust.phone;
            document.getElementById('cust-address').value = cust.address;
            document.getElementById('customer-form-error').innerHTML = '';
            bsModal.show();
          }
        });
      });

      // Submit customer
      document.getElementById('customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('cust-id').value;
        const name = document.getElementById('cust-name').value;
        const type = document.getElementById('cust-type').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;

        const res = salesService.saveCustomer({
          customer_id: id ? Number(id) : undefined,
          name, customer_type: type, phone, address
        });

        if (res.success) {
          bsModal.hide();
          utils.showToast(id ? 'Customer updated successfully.' : 'New customer added.');
          render(searchInput.value);
        } else {
          document.getElementById('customer-form-error').innerHTML = `
            <div class="alert alert-danger small py-2">${res.error}</div>
          `;
        }
      });
    }

    render();
  };

  // ==========================================
  // 2. ORDERS LIST VIEW (#/sales/orders)
  // ==========================================
  window.pageSalesOrders = function(params, container) {
    let currentFilter = 'ALL';
    let currentSearch = '';

    function render() {
      const orders = salesService.getOrders({ status: currentFilter, search: currentSearch });

      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold text-dark mb-1">Sales &amp; Custom Orders</h2>
            <p class="text-muted small mb-0">Track customized endek fabric orders from initial request to delivery</p>
          </div>
          <a href="#/sales/orders/new" class="btn btn-terracotta">
            <i class="bi bi-plus-circle me-1"></i> New Custom Order
          </a>
        </div>

        <div class="card-custom">
          <div class="card-header-custom flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <div class="input-group" style="max-width: 260px;">
                <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control border-start-0 ps-0" id="order-search-input" placeholder="Search SO code or customer..." value="${currentSearch}">
              </div>

              <select class="form-select form-select-sm" id="order-status-filter" style="width: auto;">
                <option value="ALL" ${currentFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
                <option value="Confirmed" ${currentFilter === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="In Production" ${currentFilter === 'In Production' ? 'selected' : ''}>In Production</option>
                <option value="Ready for Delivery" ${currentFilter === 'Ready for Delivery' ? 'selected' : ''}>Ready for Delivery</option>
                <option value="Delivered" ${currentFilter === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Completed" ${currentFilter === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>

            <span class="text-muted small">${orders.length} order(s) listed</span>
          </div>

          <div class="table-responsive">
            <table class="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                      No orders found. Click "New Custom Order" to create one.
                    </td>
                  </tr>
                ` : orders.map(o => `
                  <tr>
                    <td><strong>${o.order_code}</strong></td>
                    <td>
                      <div>${o.customer ? o.customer.name : 'Unknown Customer'}</div>
                      <small class="text-muted">${o.customer ? o.customer.customer_type : ''}</small>
                    </td>
                    <td>${utils.formatDate(o.order_date)}</td>
                    <td>${utils.formatDate(o.due_date)}</td>
                    <td class="fw-bold text-dark">${utils.formatRupiah(o.total_amount)}</td>
                    <td>${utils.getOrderStatusBadge(o.status)}</td>
                    <td class="text-end">
                      <a href="#/sales/orders/${o.order_id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i> View Details
                      </a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Listeners
      document.getElementById('order-search-input').addEventListener('input', function() {
        currentSearch = this.value;
        render();
      });

      document.getElementById('order-status-filter').addEventListener('change', function() {
        currentFilter = this.value;
        render();
      });
    }

    render();
  };

  // ==========================================
  // 3. NEW CUSTOM ORDER VIEW (#/sales/orders/new)
  // ==========================================
  window.pageSalesOrderNew = function(params, container) {
    const customers = salesService.getCustomers();
    const products = db.all('products');
    const materials = inventoryService.getMaterials();

    // Default due date: 14 days from now
    const today = utils.getTodayDate();
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const defaultDueDate = d.toISOString().split('T')[0];

    // Initial items state
    let itemsState = [
      { product_id: products[0] ? products[0].product_id : '', size: 'Standard (2.5m x 1.05m)', quantity_m: 20 }
    ];

    container.innerHTML = `
      <div class="mb-4">
        <a href="#/sales/orders" class="text-decoration-none small text-muted"><i class="bi bi-arrow-left me-1"></i> Back to Orders</a>
        <h2 class="h4 fw-bold text-dark mt-2 mb-1">Create Custom Endek Order</h2>
        <p class="text-muted small mb-0">Order-to-Cash kickoff: Automatic stock checking and production order generation</p>
      </div>

      <div class="row g-4">
        <!-- Left: Order Form -->
        <div class="col-lg-7">
          <div class="card-custom">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-file-earmark-text me-2 text-primary"></i>Order Information</h5>
            </div>
            <div class="card-body-custom">
              <div id="new-order-error-container"></div>

              <form id="new-order-form">
                <div class="row g-3 mb-3">
                  <div class="col-md-7">
                    <label class="form-label fw-semibold">Customer *</label>
                    <select class="form-select" id="order-customer" required>
                      <option value="">-- Choose Customer --</option>
                      ${customers.map(c => `<option value="${c.customer_id}">${c.name} (${c.customer_type})</option>`).join('')}
                    </select>
                  </div>
                  <div class="col-md-5">
                    <label class="form-label fw-semibold">Due Date *</label>
                    <input type="date" class="form-control" id="order-due-date" value="${defaultDueDate}" min="${today}" required>
                  </div>
                </div>

                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="fw-bold small text-uppercase text-muted">Order Fabric Items</span>
                  <button type="button" class="btn btn-sm btn-outline-primary" id="btn-add-item">
                    <i class="bi bi-plus me-1"></i> Add Another Fabric
                  </button>
                </div>

                <div id="order-items-wrapper">
                  <!-- Dynamically rendered item rows -->
                </div>

                <div class="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 my-4 border">
                  <div>
                    <div class="small text-muted text-uppercase fw-semibold">Estimated Total Amount:</div>
                    <div class="h4 fw-bold text-primary mb-0" id="order-grand-total">Rp0</div>
                  </div>
                  <button type="submit" class="btn btn-terracotta px-4 py-2" id="btn-submit-order">
                    <i class="bi bi-check2-circle me-1"></i> Confirm &amp; Save Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Right: Live Stock Requirement & Availability Panel (PRD 6.1 & 6.2) -->
        <div class="col-lg-5">
          <div class="card-custom border-primary">
            <div class="card-header-custom bg-primary text-white" style="border-top-left-radius: 12px; border-top-right-radius: 12px;">
              <h5 class="h6 text-white mb-0"><i class="bi bi-shield-check me-2"></i>Live Stock Check Panel</h5>
              <span class="badge bg-light text-primary small">Auto-Calculated</span>
            </div>
            <div class="card-body-custom">
              <p class="small text-muted mb-3">
                System evaluates yarn and dye requirements for this batch against current warehouse stock. <strong>If any material is insufficient, the order will be blocked.</strong>
              </p>

              <div id="live-stock-check-container">
                <!-- Live stock status table rendered here -->
              </div>

              <div class="mt-4 p-3 bg-light rounded-3 border small">
                <div class="fw-bold text-dark mb-1"><i class="bi bi-info-circle text-primary me-1"></i>Demo Test Shortcuts:</div>
                <div class="text-muted mb-2">You can quickly test both PRD scenarios:</div>
                <div class="d-grid gap-2">
                  <button type="button" class="btn btn-sm btn-outline-success text-start" id="shortcut-valid-demo">
                    <i class="bi bi-check me-1"></i> <strong>Scenario 3 (Pass):</strong> 20m Endek Cepuk Merah (Stock Sufficient)
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger text-start" id="shortcut-shortage-demo">
                    <i class="bi bi-x me-1"></i> <strong>Scenario 4 (Reject):</strong> 150m Endek Cepuk Merah (Thread Shortage)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    function updateStockCheckAndTotal() {
      // 1. Calculate Grand Total
      let grandTotal = 0;
      itemsState.forEach(it => {
        const prod = products.find(p => p.product_id == it.product_id);
        const price = prod ? Number(prod.price_per_meter) : 0;
        const qty = Number(it.quantity_m) || 0;
        grandTotal += price * qty;
      });
      document.getElementById('order-grand-total').textContent = utils.formatRupiah(grandTotal);

      // 2. Calculate Stock Check
      const stockCheck = salesService.validateStockAvailability(itemsState);
      const containerEl = document.getElementById('live-stock-check-container');

      if (!itemsState.length || itemsState.every(it => !it.product_id || !it.quantity_m)) {
        containerEl.innerHTML = `<div class="text-muted text-center py-3">Select a fabric and quantity to check raw materials.</div>`;
        return;
      }

      let rowsHtml = '';
      stockCheck.requirements.forEach(req => {
        const isShort = req.is_short;
        rowsHtml += `
          <tr class="${isShort ? 'table-danger' : ''}">
            <td>
              <strong>${req.material_name}</strong>
              <div class="text-muted" style="font-size:0.75rem">${req.material_type}</div>
            </td>
            <td><strong>${req.needed_qty}</strong> ${req.unit}</td>
            <td>
              <span class="${isShort ? 'text-danger fw-bold' : ''}">${req.current_stock}</span> ${req.unit}
            </td>
            <td class="text-end">
              ${isShort ?
                `<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Short (${req.shortage} ${req.unit})</span>` :
                `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Sufficient</span>`
              }
            </td>
          </tr>
        `;
      });

      const overallAlert = stockCheck.valid ? `
        <div class="alert alert-success d-flex align-items-center py-2 px-3 small mb-3">
          <i class="bi bi-check-circle-fill fs-5 me-2"></i>
          <div>All raw materials are in stock! Order can be safely confirmed.</div>
        </div>
      ` : `
        <div class="alert alert-danger d-flex align-items-center py-2 px-3 small mb-3">
          <i class="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
          <div><strong>Stock Shortage Detected!</strong> Please reduce meters or perform Stock In before confirming.</div>
        </div>
      `;

      containerEl.innerHTML = `
        ${overallAlert}
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead class="text-muted small">
              <tr>
                <th>Raw Material</th>
                <th>Needed</th>
                <th>Available</th>
                <th class="text-end">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderItemRows() {
      const wrapper = document.getElementById('order-items-wrapper');
      wrapper.innerHTML = itemsState.map((it, idx) => {
        const prod = products.find(p => p.product_id == it.product_id);
        const unitPrice = prod ? Number(prod.price_per_meter) : 0;
        const subtotal = unitPrice * (Number(it.quantity_m) || 0);

        return `
          <div class="p-3 bg-light rounded-3 border mb-3 item-row" data-index="${idx}">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-secondary">Fabric Item #${idx + 1}</span>
              ${itemsState.length > 1 ? `
                <button type="button" class="btn btn-sm text-danger remove-item-btn p-0" data-index="${idx}">
                  <i class="bi bi-trash"></i> Remove
                </button>
              ` : ''}
            </div>

            <div class="row g-2 align-items-center">
              <div class="col-md-5">
                <label class="form-label small fw-semibold">Endek Motif &amp; Color</label>
                <select class="form-select form-select-sm item-product-select" data-index="${idx}" required>
                  ${products.map(p => `
                    <option value="${p.product_id}" ${p.product_id == it.product_id ? 'selected' : ''}>
                      ${p.product_name} (${p.motif} - ${p.color}) - ${utils.formatRupiah(p.price_per_meter)}/m
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-semibold">Dimension / Size</label>
                <input type="text" class="form-control form-control-sm item-size-input" data-index="${idx}" value="${it.size}" placeholder="e.g. Standard 2.5m x 1.05m">
              </div>

              <div class="col-md-3">
                <label class="form-label small fw-semibold">Length (Meters) *</label>
                <input type="number" step="0.5" min="0.5" class="form-control form-control-sm item-qty-input" data-index="${idx}" value="${it.quantity_m}" required>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top small text-muted">
              <span>Unit Price: <strong>${utils.formatRupiah(unitPrice)}</strong>/meter</span>
              <span>Subtotal: <strong class="text-dark">${utils.formatRupiah(subtotal)}</strong></span>
            </div>
          </div>
        `;
      }).join('');

      // Attach row change listeners
      wrapper.querySelectorAll('.item-product-select').forEach(sel => {
        sel.addEventListener('change', function() {
          const idx = parseInt(this.getAttribute('data-index'), 10);
          itemsState[idx].product_id = this.value;
          renderItemRows();
          updateStockCheckAndTotal();
        });
      });

      wrapper.querySelectorAll('.item-size-input').forEach(inp => {
        inp.addEventListener('input', function() {
          const idx = parseInt(this.getAttribute('data-index'), 10);
          itemsState[idx].size = this.value;
        });
      });

      wrapper.querySelectorAll('.item-qty-input').forEach(inp => {
        inp.addEventListener('input', function() {
          const idx = parseInt(this.getAttribute('data-index'), 10);
          itemsState[idx].quantity_m = this.value;
          updateStockCheckAndTotal();
        });
      });

      wrapper.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = parseInt(this.getAttribute('data-index'), 10);
          itemsState.splice(idx, 1);
          renderItemRows();
          updateStockCheckAndTotal();
        });
      });
    }

    renderItemRows();
    updateStockCheckAndTotal();

    // Add item button
    document.getElementById('btn-add-item').addEventListener('click', function() {
      itemsState.push({
        product_id: products[0] ? products[0].product_id : '',
        size: 'Standard (2.5m x 1.05m)',
        quantity_m: 10
      });
      renderItemRows();
      updateStockCheckAndTotal();
    });

    // Shortcuts for Acceptance Scenarios 3 & 4
    document.getElementById('shortcut-valid-demo').addEventListener('click', function() {
      // Scenario 3: 20 m Endek Cepuk Merah (Product 1)
      itemsState = [
        { product_id: 1, size: 'Standard (2.5m x 1.05m)', quantity_m: 20 }
      ];
      renderItemRows();
      updateStockCheckAndTotal();
      document.getElementById('new-order-error-container').innerHTML = '';
      utils.showToast('Pre-filled 20 meters of Endek Cepuk Merah (Scenario 3)', 'info');
    });

    document.getElementById('shortcut-shortage-demo').addEventListener('click', function() {
      // Scenario 4: 150 m of Endek Cepuk Merah
      itemsState = [
        { product_id: 1, size: 'Standard (2.5m x 1.05m)', quantity_m: 150 }
      ];
      renderItemRows();
      updateStockCheckAndTotal();
      document.getElementById('new-order-error-container').innerHTML = '';
      utils.showToast('Pre-filled 150 meters (Shortage Scenario 4)', 'warning');
    });

    // Submit Order Form (PRD 6.2)
    document.getElementById('new-order-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const customerId = document.getElementById('order-customer').value;
      const dueDate = document.getElementById('order-due-date').value;
      const errorContainer = document.getElementById('new-order-error-container');

      const res = salesService.createOrder({
        customer_id: customerId,
        due_date: dueDate,
        items: itemsState
      });

      if (res.success) {
        utils.showToast(`Order ${res.order.order_code} confirmed! Production orders initialized.`);
        window.location.hash = `#/sales/orders/${res.order.order_id}`;
      } else {
        errorContainer.innerHTML = `
          <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            <h6 class="fw-bold mb-1"><i class="bi bi-x-octagon-fill me-1"></i> Order Rejected!</h6>
            <div>${res.error}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>
        `;
        window.scrollTo(0, 0);
      }
    });
  };

  // ==========================================
  // 4. ORDER DETAIL & TRACEABILITY PANEL (#/sales/orders/:id)
  // ==========================================
  window.pageSalesOrderDetail = function(params, container) {
    const orderId = params.id;
    const order = salesService.getOrder(orderId);

    if (!order) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-exclamation-circle fs-1 text-danger"></i>
          <h3 class="h5 mt-3">Order Not Found</h3>
          <p class="text-muted">The requested order does not exist or has been removed.</p>
          <a href="#/sales/orders" class="btn btn-outline-primary">Back to Orders</a>
        </div>
      `;
      return;
    }

    const traceData = salesService.getOrderTraceability(orderId);
    const user = auth.getCurrentUser();
    const canRecordDelivery = (user.role === 'Owner' || user.role === 'Admin') && order.status === 'Ready for Delivery';

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <a href="#/sales/orders" class="text-decoration-none small text-muted"><i class="bi bi-arrow-left me-1"></i> Back to Orders</a>
          <div class="d-flex align-items-center gap-3 mt-2">
            <h2 class="h4 fw-bold text-dark mb-0">${order.order_code}</h2>
            ${utils.getOrderStatusBadge(order.status)}
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          ${canRecordDelivery ? `
            <button class="btn btn-primary-custom" id="btn-record-delivery">
              <i class="bi bi-truck me-1"></i> Record Delivery
            </button>
          ` : ''}
          ${order.invoice ? `
            <a href="#/finance/invoices" class="btn btn-outline-secondary">
              <i class="bi bi-receipt me-1"></i> View Invoice (${order.invoice.invoice_code})
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Order Metadata & Customer Card -->
      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-person-badge me-2 text-primary"></i>Customer Information</h5>
            </div>
            <div class="card-body-custom">
              <h6 class="fw-bold text-dark mb-1">${order.customer ? order.customer.name : 'Unknown'}</h6>
              <div class="mb-2">
                <span class="badge bg-secondary-subtle text-secondary">${order.customer ? order.customer.customer_type : ''}</span>
              </div>
              <div class="small text-muted mb-1"><i class="bi bi-telephone me-2"></i>${order.customer ? order.customer.phone : '-'}</div>
              <div class="small text-muted"><i class="bi bi-geo-alt me-2"></i>${order.customer ? order.customer.address : '-'}</div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-calendar3 me-2 text-primary"></i>Order Schedule &amp; Financials</h5>
            </div>
            <div class="card-body-custom">
              <div class="row g-2">
                <div class="col-6">
                  <div class="small text-muted">Order Date:</div>
                  <div class="fw-semibold text-dark">${utils.formatDate(order.order_date)}</div>
                </div>
                <div class="col-6">
                  <div class="small text-muted">Due Date:</div>
                  <div class="fw-semibold text-dark">${utils.formatDate(order.due_date)}</div>
                </div>
                <div class="col-6 mt-3">
                  <div class="small text-muted">Total Order Value:</div>
                  <div class="h5 fw-bold text-primary mb-0">${utils.formatRupiah(order.total_amount)}</div>
                </div>
                <div class="col-6 mt-3">
                  <div class="small text-muted">Delivery Status:</div>
                  <div class="fw-semibold">${order.delivery ? `<span class="text-success"><i class="bi bi-check2 me-1"></i>Delivered on ${utils.formatDate(order.delivery.delivery_date)}</span>` : '<span class="text-muted">Not Delivered</span>'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ordered Fabric Items -->
      <div class="card-custom mb-4">
        <div class="card-header-custom">
          <h5 class="h6"><i class="bi bi-box me-2 text-primary"></i>Ordered Fabric Items</h5>
          <span class="badge bg-light text-dark border">${order.items.length} Item(s)</span>
        </div>
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Product / Motif</th>
                <th>Color</th>
                <th>Dimension / Size</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th class="text-end">Linked Production Order</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(it => `
                <tr>
                  <td>
                    <strong>${it.product ? it.product.product_name : 'Unknown Product'}</strong>
                    <div class="text-muted small">${it.product ? it.product.motif : ''}</div>
                  </td>
                  <td>${it.product ? it.product.color : '-'}</td>
                  <td>${it.size}</td>
                  <td><strong>${it.quantity_m}</strong> meters</td>
                  <td>${utils.formatRupiah(it.unit_price)}</td>
                  <td class="fw-bold">${utils.formatRupiah(Number(it.unit_price) * Number(it.quantity_m))}</td>
                  <td class="text-end">
                    ${it.production_order ? `
                      <a href="#/production/orders/${it.production_order.production_id}" class="badge bg-primary text-decoration-none p-2">
                        <i class="bi bi-gear-fill me-1"></i> ${it.production_order.production_code} &bull; ${it.production_order.status}
                      </a>
                    ` : '<span class="text-muted">-</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ORDER TRACEABILITY PANEL (PRD Section 7.7) -->
      <div class="card-custom border-primary shadow-sm mb-4">
        <div class="card-header-custom bg-primary text-white" style="border-top-left-radius: 12px; border-top-right-radius: 12px;">
          <div>
            <h5 class="h6 text-white mb-0"><i class="bi bi-diagram-3-fill me-2"></i>End-to-End Order Traceability Audit Trail</h5>
            <small class="text-white-50">One connected lifecycle: Sales &rarr; Production &rarr; Inventory &rarr; Invoice &rarr; Payment &rarr; Finance</small>
          </div>
          <span class="badge bg-light text-primary fw-bold">Live Data Linked</span>
        </div>
        <div class="card-body-custom">
          <!-- Flow Step Diagram -->
          <div class="trace-step-container d-none d-md-flex">
            <div class="trace-step-node completed">
              <div class="trace-step-icon"><i class="bi bi-cart-check"></i></div>
              <div class="trace-step-title">1. Sales Order</div>
              <div class="trace-step-desc">${order.order_code}</div>
            </div>

            <div class="trace-step-node ${order.status !== 'Confirmed' ? 'completed' : 'active'}">
              <div class="trace-step-icon"><i class="bi bi-gear"></i></div>
              <div class="trace-step-title">2. Production</div>
              <div class="trace-step-desc">${traceData.production_orders.map(p => p.production_code).join(', ') || 'Pending'}</div>
            </div>

            <div class="trace-step-node ${traceData.stock_movements.length > 0 ? 'completed' : ''}">
              <div class="trace-step-icon"><i class="bi bi-box-arrow-up"></i></div>
              <div class="trace-step-title">3. Stock Deducted</div>
              <div class="trace-step-desc">${traceData.stock_movements.length} OUT items</div>
            </div>

            <div class="trace-step-node ${order.invoice ? 'completed' : ''}">
              <div class="trace-step-icon"><i class="bi bi-receipt"></i></div>
              <div class="trace-step-title">4. Invoicing</div>
              <div class="trace-step-desc">${order.invoice ? order.invoice.invoice_code : 'Waiting Finish'}</div>
            </div>

            <div class="trace-step-node ${order.invoice && order.invoice.status === 'Paid' ? 'completed' : (order.invoice ? 'active' : '')}">
              <div class="trace-step-icon"><i class="bi bi-cash-stack"></i></div>
              <div class="trace-step-title">5. Payment &amp; Profit</div>
              <div class="trace-step-desc">${order.invoice ? order.invoice.status : 'Pending'}</div>
            </div>
          </div>

          <!-- Detailed Linked Records Accordion/Grid -->
          <div class="row g-3 mt-2">
            <!-- 1. Production Orders & 4 Stages -->
            <div class="col-12">
              <div class="p-3 bg-light rounded-3 border">
                <div class="fw-bold text-dark mb-2 d-flex justify-content-between align-items-center">
                  <span><i class="bi bi-gear-wide-connected text-primary me-2"></i>Production Orders &amp; Workshop Stages:</span>
                </div>
                ${traceData.production_orders.length === 0 ? '<div class="text-muted small">No production orders linked.</div>' : `
                  <div class="table-responsive">
                    <table class="table table-sm table-bordered bg-white mb-0 align-middle">
                      <thead class="table-light small">
                        <tr>
                          <th>PO Code</th>
                          <th>Status</th>
                          <th>Thread Preparation</th>
                          <th>Dyeing</th>
                          <th>Weaving</th>
                          <th>Finishing</th>
                          <th>Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${traceData.production_orders.map(p => {
                          const stages = db.where('production_stages', s => s.production_id == p.production_id);
                          const stg1 = stages.find(s => s.stage_name === 'Thread Preparation');
                          const stg2 = stages.find(s => s.stage_name === 'Dyeing');
                          const stg3 = stages.find(s => s.stage_name === 'Weaving');
                          const stg4 = stages.find(s => s.stage_name === 'Finishing');
                          return `
                            <tr>
                              <td><strong>${p.production_code}</strong></td>
                              <td>${utils.getProductionStatusBadge(p.status)}</td>
                              <td>${utils.getStageStatusBadge(stg1 ? stg1.status : 'Pending')}</td>
                              <td>${utils.getStageStatusBadge(stg2 ? stg2.status : 'Pending')}</td>
                              <td>${utils.getStageStatusBadge(stg3 ? stg3.status : 'Pending')}</td>
                              <td>${utils.getStageStatusBadge(stg4 ? stg4.status : 'Pending')}</td>
                              <td>
                                <a href="#/production/orders/${p.production_id}" class="btn btn-xs btn-outline-primary py-0 px-2">
                                  Manage PO &rarr;
                                </a>
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                `}
              </div>
            </div>

            <!-- 2. Inventory Stock-Out Movements -->
            <div class="col-md-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <div class="fw-bold text-dark mb-2"><i class="bi bi-box-arrow-right text-danger me-2"></i>Inventory Stock-Out Deductions:</div>
                ${traceData.stock_movements.length === 0 ? `
                  <div class="text-muted small py-2">Stock has not been deducted yet (deducted upon production start).</div>
                ` : `
                  <ul class="list-group list-group-flush bg-white rounded border small">
                    ${traceData.stock_movements.map(m => `
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>${m.material ? m.material.material_name : 'Material'}</strong>
                          <div class="text-muted" style="font-size:0.75rem">${utils.formatDate(m.movement_date)} &bull; ${m.note}</div>
                        </div>
                        <div class="text-end">
                          <span class="badge bg-danger text-white">-${m.quantity} ${m.material ? m.material.unit : ''}</span>
                          <div class="text-muted" style="font-size:0.75rem">${utils.formatRupiah(m.total_cost)}</div>
                        </div>
                      </li>
                    `).join('')}
                    <li class="list-group-item d-flex justify-content-between align-items-center bg-light fw-bold">
                      <span>Total Material Cost:</span>
                      <span class="text-danger">${utils.formatRupiah(traceData.total_material_cost)}</span>
                    </li>
                  </ul>
                `}
              </div>
            </div>

            <!-- 3. Finance & Invoicing Traceability -->
            <div class="col-md-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <div class="fw-bold text-dark mb-2"><i class="bi bi-cash-stack text-success me-2"></i>Finance &amp; Invoicing Records:</div>
                ${!order.invoice ? `
                  <div class="text-muted small py-2">Invoice will be created automatically once production Finishing is confirmed.</div>
                ` : `
                  <div class="bg-white p-3 rounded border small">
                    <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <div>
                        <strong>Invoice: ${order.invoice.invoice_code}</strong>
                        <div class="text-muted">${utils.formatDate(order.invoice.invoice_date)}</div>
                      </div>
                      ${utils.getInvoiceStatusBadge(order.invoice.status)}
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted">Total Invoiced:</span>
                      <strong>${utils.formatRupiah(order.invoice.total_amount)}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted">Payments Received:</span>
                      <strong class="text-success">${utils.formatRupiah(traceData.payments.reduce((s, p) => s + Number(p.amount), 0))}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted">Remaining Balance:</span>
                      <strong class="text-danger">${utils.formatRupiah(order.invoice.balance)}</strong>
                    </div>
                    ${traceData.production_cost_transactions.length > 0 ? `
                      <div class="pt-2 border-top">
                        <div class="d-flex justify-content-between text-muted">
                          <span>Recorded Production Cost:</span>
                          <span class="text-danger">-${utils.formatRupiah(traceData.production_cost_transactions.reduce((s, t) => s + Number(t.amount), 0))}</span>
                        </div>
                        <div class="d-flex justify-content-between fw-bold mt-1">
                          <span>Realized Order Profit:</span>
                          <span class="text-success">${utils.formatRupiah(Number(order.total_amount) - traceData.total_material_cost)}</span>
                        </div>
                      </div>
                    ` : ''}
                    <div class="mt-3 text-end">
                      <a href="#/finance/invoices" class="btn btn-sm btn-outline-primary py-0 px-2">Open Invoices &rarr;</a>
                    </div>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delivery Record Modal -->
      <div class="modal fade" id="deliveryModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content shadow border-0">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">Record Fabric Delivery</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="delivery-form">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Delivery Date *</label>
                  <input type="date" class="form-control" id="delivery-date" value="${utils.getTodayDate()}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold">Delivery Notes / Handover Details</label>
                  <textarea class="form-control" id="delivery-notes" rows="3" placeholder="e.g. Delivered via courier / Handed to store manager..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary-custom">Confirm Delivery</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Delivery Modal listener
    if (canRecordDelivery) {
      const delModalEl = document.getElementById('deliveryModal');
      const bsDelModal = new window.bootstrap.Modal(delModalEl);

      document.getElementById('btn-record-delivery').addEventListener('click', function() {
        bsDelModal.show();
      });

      document.getElementById('delivery-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('delivery-date').value;
        const notes = document.getElementById('delivery-notes').value;

        const res = salesService.recordDelivery({
          order_id: orderId,
          delivery_date: date,
          notes: notes
        });

        if (res.success) {
          bsDelModal.hide();
          utils.showToast(`Order ${order.order_code} marked as Delivered!`);
          window.pageSalesOrderDetail(params, container);
        } else {
          utils.showToast(res.error, 'danger');
        }
      });
    }
  };

  // ==========================================
  // 5. DELIVERIES LIST VIEW (#/sales/deliveries)
  // ==========================================
  window.pageSalesDeliveries = function(params, container) {
    const deliveries = salesService.getDeliveries();

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 class="h4 fw-bold text-dark mb-1">Deliveries Log</h2>
          <p class="text-muted small mb-0">Record of dispatched and handed over finished endek orders</p>
        </div>
      </div>

      <div class="card-custom">
        <div class="card-header-custom">
          <h5 class="h6"><i class="bi bi-truck me-2 text-primary"></i>Completed Deliveries</h5>
          <span class="text-muted small">${deliveries.length} delivery record(s)</span>
        </div>
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Order Code</th>
                <th>Customer</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Notes / Handover Details</th>
                <th class="text-end">Trace</th>
              </tr>
            </thead>
            <tbody>
              ${deliveries.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center py-4 text-muted">No deliveries recorded yet.</td>
                </tr>
              ` : deliveries.map(d => `
                <tr>
                  <td><strong>#DEL-${String(d.delivery_id).padStart(3, '0')}</strong></td>
                  <td><strong>${d.order ? d.order.order_code : '-'}</strong></td>
                  <td>${d.customer ? d.customer.name : 'Unknown Customer'}</td>
                  <td>${utils.formatDate(d.delivery_date)}</td>
                  <td><span class="badge bg-success"><i class="bi bi-check2-circle me-1"></i>Delivered</span></td>
                  <td><small class="text-muted">${d.notes || '-'}</small></td>
                  <td class="text-end">
                    <a href="#/sales/orders/${d.order_id}" class="btn btn-sm btn-outline-primary py-0 px-2">
                      <i class="bi bi-diagram-3 me-1"></i> Trace
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };
})(window);
