/**
 * Production Module Page Views: Production Orders List and Detail View with 4-Stage Stepper & Finished Goods Confirmation
 */

(function(window) {
  'use strict';

  // ==========================================
  // 1. PRODUCTION ORDERS LIST (#/production/orders)
  // ==========================================
  window.pageProductionOrders = function(params, container) {
    let currentFilter = 'ALL';

    function render() {
      const pos = productionService.getProductionOrders({ status: currentFilter });

      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold text-dark mb-1">Production Workshop Pipeline</h2>
            <p class="text-muted small mb-0">Monitor loom schedule, stage progression, and quality control (PRD Section 7.5)</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <select class="form-select form-select-sm" id="po-status-filter" style="width: auto;">
              <option value="ALL" ${currentFilter === 'ALL' ? 'selected' : ''}>All Production Statuses</option>
              <option value="Waiting" ${currentFilter === 'Waiting' ? 'selected' : ''}>Waiting to Start</option>
              <option value="In Progress" ${currentFilter === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${currentFilter === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>

        <div class="card-custom">
          <div class="card-header-custom">
            <h5 class="h6"><i class="bi bi-gear-wide-connected me-2 text-primary"></i>Production Work Orders</h5>
            <span class="text-muted small">${pos.length} order(s) listed</span>
          </div>
          <div class="table-responsive">
            <table class="table table-custom align-middle">
              <thead>
                <tr>
                  <th>PO Code</th>
                  <th>Order Code</th>
                  <th>Endek Fabric Product</th>
                  <th>Meters</th>
                  <th>Due Date</th>
                  <th>Current Active Stage</th>
                  <th>Status</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${pos.length === 0 ? `
                  <tr><td colspan="8" class="text-center py-4 text-muted">No production orders found in this filter.</td></tr>
                ` : pos.map(p => `
                  <tr class="${p.is_overdue ? 'table-danger' : ''}">
                    <td><strong>${p.production_code}</strong></td>
                    <td>
                      ${p.order ? `
                        <a href="#/sales/orders/${p.order.order_id}" class="text-decoration-none fw-semibold">
                          ${p.order.order_code}
                        </a>
                      ` : '-'}
                    </td>
                    <td>
                      <strong>${p.product ? p.product.product_name : 'Unknown Product'}</strong>
                      <div class="text-muted small">${p.product ? `${p.product.motif} &bull; ${p.product.color}` : ''}</div>
                    </td>
                    <td><strong>${p.item ? p.item.quantity_m : '-'}</strong> m</td>
                    <td>
                      <span class="${p.is_overdue ? 'text-danger fw-bold' : ''}">
                        ${utils.formatDate(p.due_date)}
                      </span>
                      ${p.is_overdue ? '<span class="badge bg-danger ms-1">OVERDUE</span>' : ''}
                    </td>
                    <td>
                      <span class="badge bg-light text-dark border">
                        <i class="bi bi-arrow-right-short text-primary"></i> ${p.current_stage_name}
                      </span>
                    </td>
                    <td>${utils.getProductionStatusBadge(p.status)}</td>
                    <td class="text-end">
                      <a href="#/production/orders/${p.production_id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-gear-fill me-1"></i> Open Workshop
                      </a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('po-status-filter').addEventListener('change', function() {
        currentFilter = this.value;
        render();
      });
    }

    render();
  };

  // ==========================================
  // 2. PRODUCTION DETAIL VIEW (#/production/orders/:id)
  // ==========================================
  window.pageProductionDetail = function(params, container) {
    const poId = params.id;
    const po = productionService.getProductionOrder(poId);

    if (!po) {
      container.innerHTML = `
        <div class="text-center py-5">
          <h4 class="text-danger">Production Order Not Found</h4>
          <a href="#/production/orders" class="btn btn-outline-primary mt-2">Back to Production Orders</a>
        </div>
      `;
      return;
    }

    const user = auth.getCurrentUser();
    const isSupervisor = user.role === 'Supervisor' || user.role === 'Owner';

    // Find current active stage
    const currentActiveStage = po.stages.find(s => s.status === 'In Progress');
    const isFinishingStage = currentActiveStage && currentActiveStage.stage_name === 'Finishing';

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <a href="#/production/orders" class="text-decoration-none small text-muted"><i class="bi bi-arrow-left me-1"></i> Back to Workshop</a>
          <div class="d-flex align-items-center gap-3 mt-2">
            <h2 class="h4 fw-bold text-dark mb-0">${po.production_code}</h2>
            ${utils.getProductionStatusBadge(po.status)}
            ${po.is_overdue ? '<span class="badge bg-danger">OVERDUE</span>' : ''}
          </div>
        </div>

        <!-- Workflow Action Buttons -->
        <div class="d-flex align-items-center gap-2">
          ${isSupervisor && po.status === 'Waiting' ? `
            <button class="btn btn-terracotta" id="btn-start-production">
              <i class="bi bi-play-circle-fill me-1"></i> Start Production
            </button>
          ` : ''}

          ${isSupervisor && po.status === 'In Progress' && !isFinishingStage ? `
            <button class="btn btn-primary-custom" id="btn-advance-stage">
              <i class="bi bi-check-circle-fill me-1"></i> Complete Current Stage (${currentActiveStage ? currentActiveStage.stage_name : ''})
            </button>
          ` : ''}

          ${isSupervisor && po.status === 'In Progress' && isFinishingStage ? `
            <button class="btn btn-success" id="btn-finish-goods">
              <i class="bi bi-award-fill me-1"></i> Confirm Finished Goods &amp; QC
            </button>
          ` : ''}

          <a href="#/sales/orders/${po.order ? po.order.order_id : ''}" class="btn btn-outline-secondary">
            <i class="bi bi-diagram-3 me-1"></i> Trace Sales Order
          </a>
        </div>
      </div>

      <!-- Workshop Context Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-file-text me-2 text-primary"></i>Sales Order &amp; Product Specification</h5>
            </div>
            <div class="card-body-custom">
              <div class="row g-2">
                <div class="col-6">
                  <div class="small text-muted">Sales Order:</div>
                  <strong class="text-dark">${po.order ? po.order.order_code : '-'}</strong>
                </div>
                <div class="col-6">
                  <div class="small text-muted">Customer:</div>
                  <strong class="text-dark">${po.customer ? po.customer.name : '-'}</strong>
                </div>
                <div class="col-6 mt-2">
                  <div class="small text-muted">Fabric Product:</div>
                  <strong>${po.product ? po.product.product_name : '-'}</strong>
                </div>
                <div class="col-6 mt-2">
                  <div class="small text-muted">Motif &amp; Color:</div>
                  <strong>${po.product ? `${po.product.motif} &bull; ${po.product.color}` : '-'}</strong>
                </div>
                <div class="col-6 mt-2">
                  <div class="small text-muted">Ordered Quantity:</div>
                  <strong class="text-primary fs-5">${po.item ? po.item.quantity_m : '-'} meters</strong>
                </div>
                <div class="col-6 mt-2">
                  <div class="small text-muted">Production Due Date:</div>
                  <strong class="${po.is_overdue ? 'text-danger' : 'text-dark'}">${utils.formatDate(po.due_date)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recipe & Stock Requirements for this PO -->
        <div class="col-md-6">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-boxes me-2 text-primary"></i>Raw Material Recipe &amp; Stock Check</h5>
            </div>
            <div class="card-body-custom">
              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead class="text-muted small">
                    <tr>
                      <th>Material</th>
                      <th>Recipe / m</th>
                      <th>Total Needed</th>
                      <th>Warehouse Stock</th>
                      <th class="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${po.required_materials.map(rm => `
                      <tr class="${rm.is_short ? 'table-danger' : ''}">
                        <td><strong>${rm.material_name}</strong></td>
                        <td>${rm.qty_per_meter} ${rm.unit}</td>
                        <td><strong>${rm.needed_qty}</strong> ${rm.unit}</td>
                        <td>${rm.current_stock} ${rm.unit}</td>
                        <td class="text-end">
                          ${po.status !== 'Waiting' ?
                            '<span class="badge bg-secondary">Deducted (OUT)</span>' :
                            (rm.is_short ? '<span class="badge bg-danger">Shortage</span>' : '<span class="badge bg-success">Available</span>')
                          }
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${po.status === 'Waiting' ? `
                <div class="small text-muted mt-2">
                  <i class="bi bi-info-circle me-1 text-primary"></i>Stock will be automatically deducted from inventory upon clicking "Start Production" (PRD 6.3).
                </div>
              ` : `
                <div class="small text-muted mt-2">
                  <i class="bi bi-check-circle me-1 text-success"></i>Stock deducted upon production start. Total material valuation: <strong>${utils.formatRupiah(po.total_material_cost)}</strong>.
                </div>
              `}
            </div>
          </div>
        </div>
      </div>

      <!-- VISUAL 4-STEP PROGRESSION PIPELINE (PRD Section 6.4 & 7.5) -->
      <div class="card-custom mb-4">
        <div class="card-header-custom">
          <h5 class="h6"><i class="bi bi-layers-fill me-2 text-primary"></i>4-Stage Balinese Endek Production Pipeline</h5>
          <span class="badge bg-light text-dark border">Thread Preparation &rarr; Dyeing &rarr; Weaving &rarr; Finishing</span>
        </div>
        <div class="card-body-custom">
          <div class="production-pipeline">
            ${po.stages.map((stg, idx) => {
              const isDone = stg.status === 'Done';
              const isInProg = stg.status === 'In Progress';
              const isPending = stg.status === 'Pending';
              const stageClass = isDone ? 'stage-done' : isInProg ? 'stage-in_progress' : 'stage-pending';

              return `
                <div class="pipeline-stage ${stageClass}">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-secondary-subtle text-secondary small">Stage ${idx + 1}</span>
                    ${utils.getStageStatusBadge(stg.status)}
                  </div>
                  <h6 class="fw-bold text-dark mb-1">${stg.stage_name}</h6>
                  
                  <div class="small text-muted mt-2 pt-2 border-top">
                    <div>Officer: <strong>${stg.officer ? stg.officer.name : (isInProg && user ? user.name : '-')}</strong></div>
                    <div>Started: ${stg.started_at ? utils.formatDateTime(stg.started_at) : '-'}</div>
                    <div>Finished: ${stg.finished_at ? utils.formatDateTime(stg.finished_at) : (isInProg ? '<span class="text-warning fw-semibold">In Progress</span>' : '-')}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Stage History & Quality Details -->
      <div class="row g-4 mb-4">
        <!-- Stage History Log Table -->
        <div class="col-lg-8">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-clock-history me-2 text-primary"></i>Stage Audit History Log</h5>
            </div>
            <div class="table-responsive">
              <table class="table table-custom align-middle">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Status</th>
                    <th>Supervisor / Officer</th>
                    <th>Started At</th>
                    <th>Finished At</th>
                  </tr>
                </thead>
                <tbody>
                  ${po.stages.map(stg => `
                    <tr>
                      <td><strong>${stg.stage_name}</strong></td>
                      <td>${utils.getStageStatusBadge(stg.status)}</td>
                      <td>${stg.officer ? stg.officer.name : '-'}</td>
                      <td><small>${stg.started_at ? utils.formatDateTime(stg.started_at) : '-'}</small></td>
                      <td><small>${stg.finished_at ? utils.formatDateTime(stg.finished_at) : '-'}</small></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Finished Goods & QC Report -->
        <div class="col-lg-4">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-award me-2 text-primary"></i>Quality Control (QC)</h5>
            </div>
            <div class="card-body-custom">
              ${po.status === 'Completed' ? `
                <div class="p-3 bg-light rounded-3 border">
                  <div class="small text-muted text-uppercase fw-semibold">Finished Fabric Output:</div>
                  <div class="h4 fw-bold text-success mt-1">${po.qty_finished} meters</div>
                  <div class="small text-muted text-uppercase fw-semibold mt-3">Quality Inspection Note:</div>
                  <p class="mb-0 text-dark fst-italic">"${po.quality_note || 'Passed all quality standards'}"</p>
                </div>
              ` : `
                <div class="text-center py-4 text-muted">
                  <i class="bi bi-hourglass-split fs-2 mb-2 d-block text-secondary"></i>
                  Output quantity and QC inspection notes will be recorded when the <strong>Finishing</strong> stage is completed.
                </div>
              `}
            </div>
          </div>
        </div>
      </div>

      <!-- Confirm Finished Goods Modal (PRD 6.5) -->
      <div class="modal fade" id="finishedGoodsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content shadow border-0">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">Confirm Finished Goods Output</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="finished-goods-form">
              <div class="modal-body">
                <p class="small text-muted">
                  Finishing stage is complete. Please verify output meters and note quality details before finalizing.
                </p>
                <div class="mb-3">
                  <label class="form-label fw-semibold">Finished Output Length (Meters) *</label>
                  <input type="number" step="0.1" min="0.1" class="form-control" id="fg-qty" value="${po.item ? po.item.quantity_m : ''}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold">Quality Note / Inspection Feedback *</label>
                  <textarea class="form-control" id="fg-note" rows="3" required placeholder="e.g. Passed QC: Uniform tension, vibrant motif, handed over to sales packaging..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-success">Confirm Finished Goods</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // 1. "Start Production" Button Listener (PRD 6.3)
    const startBtn = document.getElementById('btn-start-production');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        utils.showConfirmModal(
          'Start Production Work Order',
          `Are you sure you want to start production for <strong>${po.production_code}</strong>? This will deduct the required raw thread and dye stock immediately and begin Stage 1 (Thread Preparation).`,
          function() {
            const res = productionService.startProduction(po.production_id, user.user_id);
            if (res.success) {
              utils.showToast(`Production ${po.production_code} started! Stock deducted and Thread Preparation in progress.`);
              window.pageProductionDetail(params, container);
            } else {
              utils.showToast(res.error, 'danger');
            }
          }
        );
      });
    }

    // 2. "Complete Current Stage" Button Listener (PRD 6.4)
    const advanceBtn = document.getElementById('btn-advance-stage');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', function() {
        const res = productionService.advanceStage(po.production_id, user.user_id);
        if (res.success) {
          utils.showToast(`Stage completed: "${res.completedStage}". Advanced to "${res.nextStage}".`);
          window.pageProductionDetail(params, container);
        } else {
          utils.showToast(res.error, 'danger');
        }
      });
    }

    // 3. "Confirm Finished Goods" Modal & Submit (PRD 6.5)
    const finishBtn = document.getElementById('btn-finish-goods');
    if (finishBtn) {
      const modalEl = document.getElementById('finishedGoodsModal');
      const bsModal = new window.bootstrap.Modal(modalEl);

      finishBtn.addEventListener('click', function() {
        bsModal.show();
      });

      document.getElementById('finished-goods-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const qty = document.getElementById('fg-qty').value;
        const note = document.getElementById('fg-note').value;

        const res = productionService.confirmFinishedGoods({
          production_id: po.production_id,
          qty_finished: qty,
          quality_note: note,
          user_id: user.user_id
        });

        if (res.success) {
          bsModal.hide();
          utils.showToast(`Finished goods confirmed! Production marked Completed. Order is Ready for Delivery and Invoice generated.`);
          window.pageProductionDetail(params, container);
        } else {
          utils.showToast(res.error, 'danger');
        }
      });
    }
  };
})(window);
