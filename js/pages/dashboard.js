/**
 * Dashboard Page View - 6 Core Interactive Widgets calculated live from shared data
 */

(function(window) {
  'use strict';

  let salesChartInstance = null;
  let statusChartInstance = null;

  window.pageDashboard = function(params, container) {
    const user = auth.getCurrentUser();
    const metrics = financeService.getDashboardMetrics();

    // Check if role is Supervisor
    const isSupervisor = user && user.role === 'Supervisor';

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 class="h4 fw-bold text-dark mb-1">Operational Dashboard</h2>
          <p class="text-muted small mb-0">Live integrated metrics for Endek Ayuwindy Bali</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-light text-dark border p-2">
            <i class="bi bi-calendar-event me-1 text-primary"></i> ${utils.formatDate(utils.getTodayDate())}
          </span>
          ${user.role === 'Owner' ? `
            <a href="#/settings" class="btn btn-sm btn-outline-danger">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Demo Data
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Top Summary Cards Row -->
      <div class="row g-3 mb-4">
        <!-- 1. Sales This Month Widget Card -->
        ${!isSupervisor ? `
        <div class="col-xl-3 col-md-6">
          <div class="card-custom metric-card p-3" onclick="window.location.hash='#/sales/orders'">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="metric-label">Sales This Month</div>
                <div class="metric-value mt-1 text-primary">${utils.formatRupiah(metrics.salesThisMonth)}</div>
                <div class="small text-muted mt-1"><i class="bi bi-arrow-up-right me-1 text-success"></i>Current period</div>
              </div>
              <div class="metric-icon bg-primary bg-opacity-10 text-primary">
                <i class="bi bi-currency-dollar"></i>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 2. Stock Level & Low Stock Alert Widget Card -->
        <div class="${isSupervisor ? 'col-md-4' : 'col-xl-3 col-md-6'}">
          <div class="card-custom metric-card ${metrics.lowStockCount > 0 ? 'accent-danger' : 'accent-success'} p-3" onclick="window.location.hash='#/inventory/materials'">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="metric-label">Stock Status</div>
                <div class="metric-value mt-1 ${metrics.lowStockCount > 0 ? 'text-danger' : 'text-success'}">
                  ${metrics.lowStockCount} <span class="fs-6 fw-normal text-muted">Low Item(s)</span>
                </div>
                <div class="small ${metrics.lowStockCount > 0 ? 'text-danger' : 'text-success'} mt-1">
                  <i class="bi ${metrics.lowStockCount > 0 ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-1"></i>
                  ${metrics.lowStockCount > 0 ? 'Requires attention' : 'All materials healthy'}
                </div>
              </div>
              <div class="metric-icon ${metrics.lowStockCount > 0 ? 'bg-danger' : 'bg-success'} bg-opacity-10 ${metrics.lowStockCount > 0 ? 'text-danger' : 'text-success'}">
                <i class="bi bi-boxes"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Unpaid Invoices Widget Card -->
        ${!isSupervisor ? `
        <div class="col-xl-3 col-md-6">
          <div class="card-custom metric-card accent-terracotta p-3" onclick="window.location.hash='#/finance/invoices'">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="metric-label">Unpaid Invoices</div>
                <div class="metric-value mt-1 text-danger">${utils.formatRupiah(metrics.totalUnpaidAmount)}</div>
                <div class="small text-muted mt-1">${metrics.unpaidInvoicesCount} invoice(s) pending</div>
              </div>
              <div class="metric-icon bg-danger bg-opacity-10 text-danger">
                <i class="bi bi-receipt"></i>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 6. Profit Widget Card -->
        ${!isSupervisor ? `
        <div class="col-xl-3 col-md-6">
          <div class="card-custom metric-card accent-gold p-3" onclick="window.location.hash='#/finance/profit'">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="metric-label">Net Profit (Material)</div>
                <div class="metric-value mt-1 text-success">${utils.formatRupiah(metrics.totalProfit)}</div>
                <div class="small text-muted mt-1">Rev: ${utils.formatRupiah(metrics.totalRevenue)}</div>
              </div>
              <div class="metric-icon bg-warning bg-opacity-10 text-warning">
                <i class="bi bi-cash-stack"></i>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Supervisor Extra Metric Cards -->
        ${isSupervisor ? `
        <div class="col-md-4">
          <div class="card-custom metric-card accent-gold p-3" onclick="window.location.hash='#/production/orders'">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="metric-label">Orders In Production</div>
                <div class="metric-value mt-1 text-warning">${metrics.orderStatusCounts['In Production'] || 0}</div>
                <div class="small text-muted mt-1">Active workshop load</div>
              </div>
              <div class="metric-icon bg-warning bg-opacity-10 text-warning">
                <i class="bi bi-gear-wide-connected"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card-custom metric-card p-3" onclick="window.location.hash='#/production/orders'">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="metric-label">Waiting to Start</div>
                <div class="metric-value mt-1 text-secondary">${metrics.orderStatusCounts['Confirmed'] || 0}</div>
                <div class="small text-muted mt-1">Pending kickoff</div>
              </div>
              <div class="metric-icon bg-secondary bg-opacity-10 text-secondary">
                <i class="bi bi-hourglass-split"></i>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Charts & Detail Rows -->
      <div class="row g-4">
        <!-- Widget 1: Monthly Sales Chart (Hidden for Supervisor) -->
        ${!isSupervisor ? `
        <div class="col-lg-6">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-bar-chart-line-fill me-2 text-primary"></i>1. Monthly Sales Performance</h5>
              <a href="#/sales/orders" class="small text-decoration-none">View Orders &rarr;</a>
            </div>
            <div class="card-body-custom">
              <div style="height: 250px;">
                <canvas id="salesMonthlyChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Widget 3: Orders by Status & Production Pipeline Stages -->
        <div class="${!isSupervisor ? 'col-lg-6' : 'col-lg-12'}">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-pie-chart-fill me-2 text-primary"></i>3. Orders by Status &amp; Stage Breakdown</h5>
              <a href="#/production/orders" class="small text-decoration-none">View Production &rarr;</a>
            </div>
            <div class="card-body-custom">
              <div class="row align-items-center">
                <div class="col-sm-6 text-center">
                  <div style="height: 200px; position: relative;">
                    <canvas id="orderStatusChart"></canvas>
                  </div>
                  <small class="text-muted d-block mt-2">Overall Order Status</small>
                </div>
                <div class="col-sm-6 mt-3 mt-sm-0">
                  <div class="fw-bold small text-dark mb-2 text-uppercase letter-spacing-1">Production Stage Pipeline:</div>
                  <ul class="list-group list-group-flush small">
                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                      <span><i class="bi bi-1-circle text-primary me-2"></i>Thread Preparation</span>
                      <span class="badge bg-primary rounded-pill">${metrics.stageCounts['Thread Preparation'] || 0} active</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                      <span><i class="bi bi-2-circle text-warning me-2"></i>Dyeing</span>
                      <span class="badge bg-warning text-dark rounded-pill">${metrics.stageCounts['Dyeing'] || 0} active</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                      <span><i class="bi bi-3-circle text-info me-2"></i>Weaving</span>
                      <span class="badge bg-info text-dark rounded-pill">${metrics.stageCounts['Weaving'] || 0} active</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                      <span><i class="bi bi-4-circle text-success me-2"></i>Finishing</span>
                      <span class="badge bg-success rounded-pill">${metrics.stageCounts['Finishing'] || 0} active</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Widget 2: Material Stock Level vs Minimum -->
        <div class="col-lg-6">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-stack me-2 text-primary"></i>2. Raw Material Stock Level</h5>
              <a href="#/inventory/materials" class="small text-decoration-none">Manage Inventory &rarr;</a>
            </div>
            <div class="card-body-custom">
              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead class="text-muted small">
                    <tr>
                      <th>Material</th>
                      <th>Current / Min</th>
                      <th>Level</th>
                      <th class="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${metrics.materials.map(m => {
                      const pct = Math.min(100, Math.round((m.current_stock / (m.min_stock * 2)) * 100));
                      const barColor = m.is_low ? 'bg-danger' : 'bg-success';
                      return `
                        <tr>
                          <td>
                            <strong>${m.material_name}</strong>
                            <div class="text-muted" style="font-size:0.75rem">${m.material_type}</div>
                          </td>
                          <td>
                            <span class="${m.is_low ? 'text-danger fw-bold' : ''}">${m.current_stock}</span> / ${m.min_stock} ${m.unit}
                          </td>
                          <td style="min-width: 110px;">
                            <div class="progress" style="height: 6px;">
                              <div class="progress-bar ${barColor}" role="progressbar" style="width: ${pct}%"></div>
                            </div>
                          </td>
                          <td class="text-end">
                            ${utils.getMaterialStockBadge(m.current_stock, m.min_stock)}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Widget 4: Production Progress / Late Orders -->
        <div class="col-lg-6">
          <div class="card-custom h-100">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-clock-history me-2 text-primary"></i>4. Active Production &amp; Due Date Tracker</h5>
              <a href="#/production/orders" class="small text-decoration-none">Workshop &rarr;</a>
            </div>
            <div class="card-body-custom">
              ${metrics.inProgressOrders.length === 0 ? `
                <div class="text-center py-4 text-muted">
                  <i class="bi bi-check2-circle fs-1 text-success mb-2 d-block"></i>
                  No orders currently in production pipeline.
                </div>
              ` : `
                <div class="table-responsive">
                  <table class="table table-sm align-middle mb-0">
                    <thead class="text-muted small">
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th class="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${metrics.inProgressOrders.map(o => `
                        <tr class="${o.is_late ? 'table-danger' : ''}">
                          <td><strong>${o.order_code}</strong></td>
                          <td>${o.customer ? o.customer.name : 'Unknown'}</td>
                          <td>
                            <span class="${o.is_late ? 'text-danger fw-bold' : ''}">
                              ${utils.formatDate(o.due_date)}
                            </span>
                            ${o.is_late ? '<span class="badge bg-danger ms-1">OVERDUE</span>' : ''}
                          </td>
                          <td>${utils.getOrderStatusBadge(o.status)}</td>
                          <td class="text-end">
                            <a href="#/sales/orders/${o.order_id}" class="btn btn-sm btn-outline-primary py-0 px-2" title="View Traceability">
                              <i class="bi bi-diagram-3"></i>
                            </a>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </div>
          </div>
        </div>

      </div>
    `;

    // Initialize Chart.js charts
    if (window.Chart) {
      // Clean up previous charts if any
      if (salesChartInstance) salesChartInstance.destroy();
      if (statusChartInstance) statusChartInstance.destroy();

      // Monthly Sales Chart
      const salesCanvas = document.getElementById('salesMonthlyChart');
      if (salesCanvas && !isSupervisor) {
        const labels = Object.keys(metrics.monthlySalesMap);
        const data = Object.values(metrics.monthlySalesMap);

        salesChartInstance = new window.Chart(salesCanvas, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['Current Month'],
            datasets: [{
              label: 'Sales (Rp)',
              data: data.length ? data : [0],
              backgroundColor: '#1F2A5A',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return utils.formatRupiah(context.parsed.y);
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(val) {
                    return 'Rp' + (val / 1000000) + 'M';
                  }
                }
              }
            }
          }
        });
      }

      // Order Status Doughnut Chart
      const statusCanvas = document.getElementById('orderStatusChart');
      if (statusCanvas) {
        const counts = metrics.orderStatusCounts;
        statusChartInstance = new window.Chart(statusCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Confirmed', 'In Production', 'Ready for Delivery', 'Delivered', 'Completed'],
            datasets: [{
              data: [
                counts['Confirmed'] || 0,
                counts['In Production'] || 0,
                counts['Ready for Delivery'] || 0,
                counts['Delivered'] || 0,
                counts['Completed'] || 0
              ],
              backgroundColor: [
                '#0dcaf0',
                '#ffc107',
                '#0d6efd',
                '#6c757d',
                '#198754'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            cutout: '65%'
          }
        });
      }
    }
  };
})(window);
