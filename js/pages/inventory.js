/**
 * Inventory Module Page Views: Materials List, Stock In with Finance Integration, Stock Card Ledger, and Stock Count Audit
 */

(function(window) {
  'use strict';

  // ==========================================
  // 1. MATERIALS LIST (#/inventory/materials)
  // ==========================================
  window.pageInventoryMaterials = function(params, container) {
    function render() {
      const materials = inventoryService.getMaterials();
      const lowCount = materials.filter(m => m.is_low).length;

      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold text-dark mb-1">Raw Materials &amp; Storage Inventory</h2>
            <p class="text-muted small mb-0">Track thread, natural dyes, and stock thresholds for endek weaving</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <a href="#/inventory/stock-in" class="btn btn-primary-custom">
              <i class="bi bi-box-arrow-in-down me-1"></i> Stock In
            </a>
            <a href="#/inventory/stock-count" class="btn btn-outline-secondary">
              <i class="bi bi-clipboard-check me-1"></i> Physical Count Audit
            </a>
            <button class="btn btn-terracotta" id="btn-add-material">
              <i class="bi bi-plus-circle me-1"></i> Add Material
            </button>
          </div>
        </div>

        ${lowCount > 0 ? `
          <div class="alert alert-danger d-flex align-items-center mb-4 shadow-sm">
            <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
            <div>
              <strong>Low Stock Warning:</strong> ${lowCount} raw material item(s) are at or below minimum threshold. Please replenish stock via Stock In to avoid production delays.
            </div>
          </div>
        ` : ''}

        <div class="card-custom">
          <div class="card-header-custom">
            <h5 class="h6"><i class="bi bi-box-seam me-2 text-primary"></i>Material Stock Master</h5>
            <span class="text-muted small">${materials.length} material(s) tracked</span>
          </div>
          <div class="table-responsive">
            <table class="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Type</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Unit Cost (Avg)</th>
                  <th>Total Valuation</th>
                  <th>Stock Status</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${materials.map(m => `
                  <tr class="${m.is_low ? 'table-danger' : ''}">
                    <td>
                      <strong>${m.material_name}</strong>
                    </td>
                    <td><span class="badge bg-light text-dark border">${m.material_type}</span></td>
                    <td>
                      <span class="fs-6 fw-bold ${m.is_low ? 'text-danger' : 'text-dark'}">${m.current_stock}</span> ${m.unit}
                    </td>
                    <td>${m.min_stock} ${m.unit}</td>
                    <td>${utils.formatRupiah(m.unit_cost)} / ${m.unit}</td>
                    <td class="fw-semibold text-muted">${utils.formatRupiah(Number(m.current_stock) * Number(m.unit_cost))}</td>
                    <td>${utils.getMaterialStockBadge(m.current_stock, m.min_stock)}</td>
                    <td class="text-end">
                      <div class="btn-group btn-group-sm">
                        <a href="#/inventory/stock-card/${m.material_id}" class="btn btn-outline-primary" title="View Stock Card Ledger">
                          <i class="bi bi-card-checklist me-1"></i> Stock Card
                        </a>
                        <button class="btn btn-outline-secondary edit-material-btn" data-id="${m.material_id}" title="Edit Material">
                          <i class="bi bi-pencil"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add/Edit Material Modal -->
        <div class="modal fade" id="materialModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content shadow border-0">
              <div class="modal-header">
                <h5 class="modal-title fw-bold" id="materialModalTitle">Add Material</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <form id="material-form">
                <div class="modal-body">
                  <div id="material-form-error"></div>
                  <input type="hidden" id="mat-id">
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Material Name *</label>
                    <input type="text" class="form-control" id="mat-name" required placeholder="e.g. Green Natural Dye">
                  </div>
                  <div class="row g-2 mb-3">
                    <div class="col-6">
                      <label class="form-label fw-semibold">Type *</label>
                      <select class="form-select" id="mat-type" required>
                        <option value="Thread">Thread</option>
                        <option value="Dye">Dye</option>
                      </select>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-semibold">Unit *</label>
                      <input type="text" class="form-control" id="mat-unit" required value="kg" placeholder="e.g. kg">
                    </div>
                  </div>
                  <div class="row g-2 mb-3">
                    <div class="col-6">
                      <label class="form-label fw-semibold">Min Stock Threshold *</label>
                      <input type="number" step="0.1" min="0" class="form-control" id="mat-min-stock" required value="2">
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-semibold">Unit Cost (Rp) *</label>
                      <input type="number" step="1000" min="0" class="form-control" id="mat-unit-cost" required value="100000">
                    </div>
                  </div>
                  <div class="mb-3" id="initial-stock-group">
                    <label class="form-label fw-semibold">Opening Stock Quantity</label>
                    <input type="number" step="0.01" min="0" class="form-control" id="mat-current-stock" value="10">
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary-custom">Save Material</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      // Modal setup
      const modalEl = document.getElementById('materialModal');
      const bsModal = new window.bootstrap.Modal(modalEl);

      document.getElementById('btn-add-material').addEventListener('click', function() {
        document.getElementById('materialModalTitle').textContent = 'Add New Material';
        document.getElementById('mat-id').value = '';
        document.getElementById('material-form').reset();
        document.getElementById('initial-stock-group').style.display = 'block';
        document.getElementById('material-form-error').innerHTML = '';
        bsModal.show();
      });

      container.querySelectorAll('.edit-material-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          const mat = inventoryService.getMaterial(id);
          if (mat) {
            document.getElementById('materialModalTitle').textContent = 'Edit Material';
            document.getElementById('mat-id').value = mat.material_id;
            document.getElementById('mat-name').value = mat.material_name;
            document.getElementById('mat-type').value = mat.material_type;
            document.getElementById('mat-unit').value = mat.unit;
            document.getElementById('mat-min-stock').value = mat.min_stock;
            document.getElementById('mat-unit-cost').value = mat.unit_cost;
            document.getElementById('initial-stock-group').style.display = 'none'; // cannot edit current stock directly here, use Stock In or Stock Count
            document.getElementById('material-form-error').innerHTML = '';
            bsModal.show();
          }
        });
      });

      // Submit material form
      document.getElementById('material-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('mat-id').value;
        const name = document.getElementById('mat-name').value;
        const type = document.getElementById('mat-type').value;
        const unit = document.getElementById('mat-unit').value;
        const minStock = document.getElementById('mat-min-stock').value;
        const unitCost = document.getElementById('mat-unit-cost').value;
        const currentStock = document.getElementById('mat-current-stock').value;

        const res = inventoryService.saveMaterial({
          material_id: id ? Number(id) : undefined,
          material_name: name,
          material_type: type,
          unit: unit,
          min_stock: minStock,
          unit_cost: unitCost,
          current_stock: currentStock
        });

        if (res.success) {
          bsModal.hide();
          utils.showToast(id ? 'Material updated.' : 'Material added.');
          render();
        } else {
          document.getElementById('material-form-error').innerHTML = `
            <div class="alert alert-danger small py-2">${res.error}</div>
          `;
        }
      });
    }

    render();
  };

  // ==========================================
  // 2. STOCK IN VIEW (#/inventory/stock-in)
  // ==========================================
  window.pageInventoryStockIn = function(params, container) {
    const materials = inventoryService.getMaterials();
    const history = inventoryService.getStockInHistory();

    container.innerHTML = `
      <div class="mb-4">
        <a href="#/inventory/materials" class="text-decoration-none small text-muted"><i class="bi bi-arrow-left me-1"></i> Back to Materials</a>
        <h2 class="h4 fw-bold text-dark mt-2 mb-1">Receive Raw Material (Stock In)</h2>
        <p class="text-muted small mb-0">Record incoming thread &amp; dyes. Automatically adjusts stock and records material purchase expense in Finance (PRD 6.8).</p>
      </div>

      <div class="row g-4">
        <!-- Stock In Form -->
        <div class="col-lg-6">
          <div class="card-custom">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-box-arrow-in-down me-2 text-primary"></i>Stock In Entry Form</h5>
            </div>
            <div class="card-body-custom">
              <div id="stock-in-error"></div>

              <form id="stock-in-form">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Select Material *</label>
                  <select class="form-select" id="stockin-material" required>
                    <option value="">-- Choose Material --</option>
                    ${materials.map(m => `
                      <option value="${m.material_id}" data-unit="${m.unit}" data-cost="${m.unit_cost}">
                        ${m.material_name} (${m.material_type}) - Current: ${m.current_stock} ${m.unit}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Quantity Received *</label>
                    <div class="input-group">
                      <input type="number" step="0.001" min="0.001" class="form-control" id="stockin-qty" required placeholder="0.00">
                      <span class="input-group-text bg-light" id="stockin-unit-addon">kg</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Total Cost (Rp) *</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light">Rp</span>
                      <input type="number" step="1000" min="1" class="form-control" id="stockin-total-cost" required placeholder="0">
                    </div>
                  </div>
                </div>

                <div class="p-3 bg-light rounded-3 mb-3 border small">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted">Calculated Unit Cost:</span>
                    <strong class="text-primary fs-6" id="stockin-calc-unit-cost">Rp0 / kg</strong>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold">Receiving Date *</label>
                  <input type="date" class="form-control" id="stockin-date" value="${utils.getTodayDate()}" required>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold">Note / Supplier Reference</label>
                  <input type="text" class="form-control" id="stockin-note" placeholder="e.g. Purchased from Denpasar Yarn Supplier">
                </div>

                <button type="submit" class="btn btn-terracotta w-100 py-2">
                  <i class="bi bi-check2-circle me-1"></i> Confirm Stock In &amp; Record Purchase
                </button>
              </form>

              <!-- Acceptance Criteria 11 Quick Shortcut -->
              <div class="mt-4 p-3 bg-light rounded-3 border">
                <div class="fw-bold text-dark small mb-1"><i class="bi bi-lightning-charge-fill text-warning me-1"></i>Demo Shortcut (Scenario 11):</div>
                <div class="text-muted small mb-2">Replenish 2 kg Indigo Dye @ Rp175,000/kg (Total Rp350,000) to clear low stock alert.</div>
                <button type="button" class="btn btn-sm btn-outline-primary w-100" id="shortcut-stockin-scenario11">
                  Fill Scenario 11: 2 kg Indigo Dye (Rp350,000)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Stock In Log -->
        <div class="col-lg-6">
          <div class="card-custom">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-clock-history me-2 text-primary"></i>Recent Stock In Receipts</h5>
              <span class="badge bg-light text-dark border">${history.length} record(s)</span>
            </div>
            <div class="table-responsive">
              <table class="table table-custom align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Total Cost</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.length === 0 ? `
                    <tr><td colspan="5" class="text-center py-4 text-muted">No stock-in transactions yet.</td></tr>
                  ` : history.map(h => `
                    <tr>
                      <td>${utils.formatDate(h.movement_date)}</td>
                      <td><strong>${h.material ? h.material.material_name : 'Material'}</strong></td>
                      <td><span class="badge bg-success">+${h.quantity} ${h.material ? h.material.unit : ''}</span></td>
                      <td class="fw-semibold">${utils.formatRupiah(h.total_cost)}</td>
                      <td><small class="text-muted">${h.note}</small></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Dynamic Unit and Unit Cost Calculation
    const matSelect = document.getElementById('stockin-material');
    const qtyInput = document.getElementById('stockin-qty');
    const costInput = document.getElementById('stockin-total-cost');
    const calcCostEl = document.getElementById('stockin-calc-unit-cost');
    const unitAddon = document.getElementById('stockin-unit-addon');

    function updateCalc() {
      const selectedOpt = matSelect.options[matSelect.selectedIndex];
      const unit = selectedOpt ? (selectedOpt.getAttribute('data-unit') || 'kg') : 'kg';
      unitAddon.textContent = unit;

      const qty = Number(qtyInput.value) || 0;
      const cost = Number(costInput.value) || 0;
      if (qty > 0 && cost > 0) {
        const unitCost = cost / qty;
        calcCostEl.textContent = `${utils.formatRupiah(unitCost)} / ${unit}`;
      } else {
        calcCostEl.textContent = `Rp0 / ${unit}`;
      }
    }

    matSelect.addEventListener('change', updateCalc);
    qtyInput.addEventListener('input', updateCalc);
    costInput.addEventListener('input', updateCalc);

    // Scenario 11 Shortcut
    document.getElementById('shortcut-stockin-scenario11').addEventListener('click', function() {
      // Find Indigo Dye (material_id 3)
      matSelect.value = '3';
      qtyInput.value = '2';
      costInput.value = '350000';
      document.getElementById('stockin-note').value = 'Replenish Indigo Dye stock (Scenario 11 demo)';
      updateCalc();
      utils.showToast('Pre-filled 2 kg Indigo Dye @ Rp350,000 for Scenario 11', 'info');
    });

    // Submit handler
    document.getElementById('stock-in-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const materialId = matSelect.value;
      const qty = qtyInput.value;
      const cost = costInput.value;
      const date = document.getElementById('stockin-date').value;
      const note = document.getElementById('stockin-note').value;

      const res = inventoryService.stockIn({
        material_id: materialId,
        quantity: qty,
        total_cost: cost,
        movement_date: date,
        note: note
      });

      if (res.success) {
        utils.showToast(`Stock In recorded! Stock updated to ${res.material.current_stock} ${res.material.unit}. Finance purchase recorded.`);
        window.location.hash = '#/inventory/materials';
      } else {
        document.getElementById('stock-in-error').innerHTML = `
          <div class="alert alert-danger small py-2 mb-3">${res.error}</div>
        `;
      }
    });
  };

  // ==========================================
  // 3. STOCK CARD LEDGER (#/inventory/stock-card/:materialId)
  // ==========================================
  window.pageInventoryStockCard = function(params, container) {
    const materials = inventoryService.getMaterials();
    let selectedId = params.materialId || (materials[0] ? materials[0].material_id : null);

    const cardData = inventoryService.getStockCard(selectedId);
    if (!cardData) {
      container.innerHTML = `
        <div class="text-center py-5">
          <h4 class="text-danger">Material Not Found</h4>
          <a href="#/inventory/materials" class="btn btn-outline-primary mt-2">Back to Materials</a>
        </div>
      `;
      return;
    }

    const mat = cardData.material;

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <a href="#/inventory/materials" class="text-decoration-none small text-muted"><i class="bi bi-arrow-left me-1"></i> Back to Materials</a>
          <h2 class="h4 fw-bold text-dark mt-2 mb-1">Stock Card Ledger: ${mat.material_name}</h2>
          <p class="text-muted small mb-0">Complete audit trail of all receipts (IN), production usage (OUT), and audit adjustments</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <label class="small text-muted fw-semibold">Switch Material:</label>
          <select class="form-select form-select-sm" id="stockcard-material-switch" style="width: auto;">
            ${materials.map(m => `
              <option value="${m.material_id}" ${m.material_id == selectedId ? 'selected' : ''}>
                ${m.material_name}
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Material Status Overview -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card-custom p-3">
            <div class="small text-muted text-uppercase fw-semibold">Current Physical Stock</div>
            <div class="h3 fw-bold text-dark mt-1 mb-0">${mat.current_stock} <span class="fs-6 text-muted">${mat.unit}</span></div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card-custom p-3">
            <div class="small text-muted text-uppercase fw-semibold">Min Stock Threshold</div>
            <div class="h3 fw-bold text-dark mt-1 mb-0">${mat.min_stock} <span class="fs-6 text-muted">${mat.unit}</span></div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card-custom p-3">
            <div class="small text-muted text-uppercase fw-semibold">Current Unit Valuation</div>
            <div class="h3 fw-bold text-primary mt-1 mb-0">${utils.formatRupiah(mat.unit_cost)}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card-custom p-3">
            <div class="small text-muted text-uppercase fw-semibold">Stock Health</div>
            <div class="mt-2">${utils.getMaterialStockBadge(mat.current_stock, mat.min_stock)}</div>
          </div>
        </div>
      </div>

      <!-- Ledger Movements Table -->
      <div class="card-custom">
        <div class="card-header-custom">
          <h5 class="h6"><i class="bi bi-journal-text me-2 text-primary"></i>Movement Transaction History</h5>
          <span class="text-muted small">${cardData.history.length} movement(s) recorded</span>
        </div>
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Running Balance</th>
                <th>Total Cost</th>
                <th>Linked Reference</th>
                <th>Note / Description</th>
              </tr>
            </thead>
            <tbody>
              ${cardData.history.length === 0 ? `
                <tr><td colspan="7" class="text-center py-4 text-muted">No movements recorded for this material.</td></tr>
              ` : cardData.history.map(m => {
                const isOut = m.movement_type === 'OUT';
                const isIn = m.movement_type === 'IN';
                const isAdj = m.movement_type === 'ADJUSTMENT';

                const badge = isIn ? '<span class="badge bg-success">IN</span>' :
                              isOut ? '<span class="badge bg-danger">OUT</span>' :
                              '<span class="badge bg-warning text-dark">ADJUSTMENT</span>';

                const qtyFormatted = isIn ? `+${m.quantity} ${mat.unit}` :
                                     isOut ? `-${m.quantity} ${mat.unit}` :
                                     `${m.quantity > 0 ? '+' : ''}${m.quantity} ${mat.unit}`;

                return `
                  <tr>
                    <td>${utils.formatDate(m.movement_date)}</td>
                    <td>${badge}</td>
                    <td class="fw-bold ${isIn ? 'text-success' : isOut ? 'text-danger' : 'text-warning-emphasis'}">
                      ${qtyFormatted}
                    </td>
                    <td class="fw-bold text-dark">${m.running_balance} ${mat.unit}</td>
                    <td>${m.total_cost ? utils.formatRupiah(m.total_cost) : '-'}</td>
                    <td>
                      ${m.production_id ? `
                        <a href="#/production/orders/${m.production_id}" class="badge bg-primary-subtle text-primary text-decoration-none">
                          <i class="bi bi-gear-fill me-1"></i>${m.linked_po_code}
                        </a>
                      ` : '<span class="text-muted">-</span>'}
                    </td>
                    <td><small class="text-muted">${m.note || '-'}</small></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Material Switch Listener
    document.getElementById('stockcard-material-switch').addEventListener('change', function() {
      window.location.hash = `#/inventory/stock-card/${this.value}`;
    });
  };

  // ==========================================
  // 4. STOCK COUNT / ADJUSTMENT (#/inventory/stock-count)
  // ==========================================
  window.pageInventoryStockCount = function(params, container) {
    const materials = inventoryService.getMaterials();

    container.innerHTML = `
      <div class="mb-4">
        <a href="#/inventory/materials" class="text-decoration-none small text-muted"><i class="bi bi-arrow-left me-1"></i> Back to Materials</a>
        <h2 class="h4 fw-bold text-dark mt-2 mb-1">Physical Stock Count &amp; Adjustment</h2>
        <p class="text-muted small mb-0">Record physical storage inventory audit results and reconcile system variance (PRD 6.9)</p>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <div class="card-custom">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-clipboard-check me-2 text-primary"></i>Stock Adjustment Reconciliation</h5>
            </div>
            <div class="card-body-custom">
              <div id="stock-count-error"></div>

              <form id="stock-count-form">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Select Material for Audit *</label>
                  <select class="form-select" id="count-material" required>
                    <option value="">-- Choose Material --</option>
                    ${materials.map(m => `
                      <option value="${m.material_id}" data-current="${m.current_stock}" data-unit="${m.unit}">
                        ${m.material_name} (Current System: ${m.current_stock} ${m.unit})
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Current System Quantity</label>
                    <input type="text" class="form-control bg-light" id="count-system-qty" readonly value="-">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Real Counted Quantity *</label>
                    <div class="input-group">
                      <input type="number" step="0.001" min="0" class="form-control" id="count-real-qty" required placeholder="Real physical count">
                      <span class="input-group-text bg-light" id="count-unit-addon">kg</span>
                    </div>
                  </div>
                </div>

                <!-- Difference Indicator -->
                <div class="p-3 bg-light rounded-3 mb-3 border">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="small text-muted fw-semibold">Reconciliation Variance (Diff):</span>
                    <strong class="fs-6" id="count-diff-preview">-</strong>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold">Audit Date *</label>
                  <input type="date" class="form-control" id="count-date" value="${utils.getTodayDate()}" required>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold">Audit Note / Explanation *</label>
                  <textarea class="form-control" id="count-note" rows="2" required placeholder="Mandatory note explaining why variance occurred (e.g. Broken dye container / Monthly physical warehouse audit)"></textarea>
                </div>

                <button type="submit" class="btn btn-terracotta w-100 py-2">
                  <i class="bi bi-save me-1"></i> Apply Stock Adjustment
                </button>
              </form>

              <!-- Acceptance Criteria 12 Shortcut -->
              <div class="mt-4 p-3 bg-light rounded-3 border">
                <div class="fw-bold text-dark small mb-1"><i class="bi bi-lightning-charge-fill text-warning me-1"></i>Demo Shortcut (Scenario 12):</div>
                <div class="text-muted small mb-2">Simulate real count difference: Audit Cotton Thread with a physical count variance.</div>
                <button type="button" class="btn btn-sm btn-outline-primary w-100" id="shortcut-count-scenario12">
                  Fill Scenario 12: Cotton Thread (Set Real Count to 24.5 kg)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card-custom">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-info-circle me-2 text-primary"></i>Rules &amp; Traceability</h5>
            </div>
            <div class="card-body-custom small text-muted">
              <p>Per PRD Section 6.9:</p>
              <ul class="ps-3 mb-3">
                <li>System calculates the exact difference: <code>difference = real_quantity - current_stock</code>.</li>
                <li>An <code>ADJUSTMENT</code> row is logged in <code>stock_movements</code> with the signed difference and timestamp.</li>
                <li>The material's <code>current_stock</code> is updated to match the real physical count immediately.</li>
                <li>A note is strictly required to preserve audit integrity.</li>
              </ul>
              <div class="alert alert-info py-2 mb-0">
                <i class="bi bi-check-circle me-1"></i> All adjustments immediately reflect in the Stock Card ledger.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const matSelect = document.getElementById('count-material');
    const systemQtyInp = document.getElementById('count-system-qty');
    const realQtyInp = document.getElementById('count-real-qty');
    const diffPreview = document.getElementById('count-diff-preview');
    const unitAddon = document.getElementById('count-unit-addon');

    function updateCountPreview() {
      const selectedOpt = matSelect.options[matSelect.selectedIndex];
      if (!selectedOpt || !selectedOpt.value) {
        systemQtyInp.value = '-';
        diffPreview.textContent = '-';
        return;
      }

      const current = Number(selectedOpt.getAttribute('data-current')) || 0;
      const unit = selectedOpt.getAttribute('data-unit') || 'kg';
      systemQtyInp.value = `${current} ${unit}`;
      unitAddon.textContent = unit;

      if (realQtyInp.value !== '') {
        const real = Number(realQtyInp.value);
        const diff = Math.round((real - current) * 1000) / 1000;
        if (diff === 0) {
          diffPreview.innerHTML = `<span class="text-success"><i class="bi bi-check2 me-1"></i>No variance (Exact Match)</span>`;
        } else if (diff > 0) {
          diffPreview.innerHTML = `<span class="text-primary fw-bold">+${diff} ${unit} (Surplus Adjustment)</span>`;
        } else {
          diffPreview.innerHTML = `<span class="text-danger fw-bold">${diff} ${unit} (Shrinkage / Loss)</span>`;
        }
      } else {
        diffPreview.textContent = '-';
      }
    }

    matSelect.addEventListener('change', updateCountPreview);
    realQtyInp.addEventListener('input', updateCountPreview);

    // Scenario 12 Shortcut
    document.getElementById('shortcut-count-scenario12').addEventListener('click', function() {
      matSelect.value = '1'; // Cotton Thread
      realQtyInp.value = '24.5';
      document.getElementById('count-note').value = 'Monthly physical count audit: 0.5 kg shrinkage due to sampling and waste';
      updateCountPreview();
      utils.showToast('Pre-filled Cotton Thread 24.5 kg count for Scenario 12', 'info');
    });

    // Submit Handler
    document.getElementById('stock-count-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const materialId = matSelect.value;
      const realQty = realQtyInp.value;
      const date = document.getElementById('count-date').value;
      const note = document.getElementById('count-note').value;

      const res = inventoryService.stockCountAdjustment({
        material_id: materialId,
        real_quantity: realQty,
        movement_date: date,
        note: note
      });

      if (res.success) {
        utils.showToast(`Stock count reconciled! Stock set to ${res.material.current_stock} ${res.material.unit}. Movement logged.`);
        window.location.hash = `#/inventory/stock-card/${res.material.material_id}`;
      } else {
        document.getElementById('stock-count-error').innerHTML = `
          <div class="alert alert-danger small py-2 mb-3">${res.error}</div>
        `;
      }
    });
  };
})(window);
