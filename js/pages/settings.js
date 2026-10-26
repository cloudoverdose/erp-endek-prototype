/**
 * Settings Page View (Owner Only) - Demo data reset mechanism and system diagnostics
 */

(function(window) {
  'use strict';

  window.pageSettings = function(params, container) {
    const user = auth.getCurrentUser();

    // Check table records
    const tables = [
      'users', 'customers', 'products', 'materials', 'material_requirements',
      'orders', 'order_items', 'deliveries', 'production_orders', 'production_stages',
      'stock_movements', 'invoices', 'payments', 'finance_transactions'
    ];

    const stats = tables.map(t => {
      return {
        table: t,
        count: db.all(t).length
      };
    });

    container.innerHTML = `
      <div class="mb-4">
        <h2 class="h4 fw-bold text-dark mb-1">System &amp; Demo Settings</h2>
        <p class="text-muted small mb-0">Prototype data management and reset controls (Owner access only)</p>
      </div>

      <div class="row g-4">
        <!-- Demo Controls Card -->
        <div class="col-lg-6">
          <div class="card-custom border-danger">
            <div class="card-header-custom bg-danger bg-opacity-10">
              <h5 class="h6 text-danger mb-0"><i class="bi bi-arrow-counterclockwise me-2"></i>Reset Demo Environment</h5>
            </div>
            <div class="card-body-custom">
              <p class="small text-muted">
                Restore all localStorage tables back to their original clean seed state (initial 5 materials, 4 products, 5 customers, and baseline history orders).
              </p>
              <div class="alert alert-warning small py-2 mb-3">
                <i class="bi bi-exclamation-triangle-fill me-1"></i> This will discard all newly added orders, stock changes, and payments created during testing.
              </div>
              <button type="button" class="btn btn-danger w-100 py-2" id="btn-reset-demo">
                <i class="bi bi-trash3 me-1"></i> Reset Demo Data to Initial State
              </button>
            </div>
          </div>

          <div class="card-custom mt-4">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-download me-2 text-primary"></i>Export Prototype Data</h5>
            </div>
            <div class="card-body-custom">
              <p class="small text-muted mb-3">
                Download a JSON snapshot containing all 14 database tables and current auto-increment counters.
              </p>
              <button type="button" class="btn btn-outline-primary w-100" id="btn-export-json">
                <i class="bi bi-file-earmark-code me-1"></i> Export Data (JSON)
              </button>
            </div>
          </div>
        </div>

        <!-- Database Diagnostics -->
        <div class="col-lg-6">
          <div class="card-custom">
            <div class="card-header-custom">
              <h5 class="h6"><i class="bi bi-database-check me-2 text-primary"></i>Database Table Statistics</h5>
              <span class="badge bg-light text-dark border">14 Tables</span>
            </div>
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead class="text-muted small">
                  <tr>
                    <th>Table Name</th>
                    <th>Storage Key</th>
                    <th class="text-end">Record Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.map(s => `
                    <tr>
                      <td><strong>${s.table}</strong></td>
                      <td><code>erp_endek_${s.table}</code></td>
                      <td class="text-end fw-bold text-primary">${s.count}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Reset Demo Button Listener
    document.getElementById('btn-reset-demo').addEventListener('click', function() {
      utils.showConfirmModal(
        'Confirm Demo Reset',
        'Are you sure you want to reset all prototype data? All changes will be replaced with initial seed data.',
        function() {
          db.reset();
          utils.showToast('Demo data successfully restored to original seed state!');
          window.location.hash = '#/dashboard';
        }
      );
    });

    // Export JSON Listener
    document.getElementById('btn-export-json').addEventListener('click', function() {
      const exportObj = {};
      tables.forEach(t => {
        exportObj[t] = db.all(t);
      });
      exportObj.counters = JSON.parse(localStorage.getItem('erp_endek_counters') || '{}');

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `erp_endek_export_${utils.getTodayDate()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      utils.showToast('JSON export downloaded successfully.');
    });
  };
})(window);
