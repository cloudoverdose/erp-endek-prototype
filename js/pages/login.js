/**
 * Login Page View
 */

(function(window) {
  'use strict';

  window.pageLogin = function(params, container) {
    container.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-header">
            <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-2" style="background: rgba(255,255,255,0.15);">
              <i class="bi bi-flower1 fs-1 text-warning"></i>
            </div>
            <h2 class="h4 fw-bold mb-1 text-white">Endek Ayuwindy Bali</h2>
            <p class="small text-white-50 mb-0">Web-Based ERP Prototype &bull; Singaraja</p>
          </div>

          <div class="login-body">
            <div id="login-alert-container"></div>

            <form id="login-form">
              <div class="mb-3">
                <label for="login-username" class="form-label fw-semibold text-dark">Username</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-person"></i></span>
                  <input type="text" class="form-control border-start-0 ps-0" id="login-username" placeholder="Enter username" required autofocus>
                </div>
              </div>

              <div class="mb-3">
                <label for="login-password" class="form-label fw-semibold text-dark">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-lock"></i></span>
                  <input type="password" class="form-control border-start-0 ps-0" id="login-password" placeholder="Enter password" required>
                </div>
              </div>

              <button type="submit" class="btn btn-terracotta w-100 py-2 mb-3 shadow-sm">
                <i class="bi bi-box-arrow-in-right me-1"></i> Sign In
              </button>
            </form>

            <div class="p-3 bg-light rounded-3 border">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold small text-dark"><i class="bi bi-info-circle-fill text-primary me-1"></i> Demo Accounts</span>
                <span class="badge bg-secondary-subtle text-secondary small">Click to autofill</span>
              </div>
              
              <div class="d-grid gap-2">
                <button type="button" class="btn btn-sm btn-outline-dark text-start d-flex justify-content-between align-items-center demo-fill-btn" data-user="owner" data-pass="owner123">
                  <span><strong>Owner:</strong> owner / owner123</span>
                  <span class="badge bg-danger">All Access</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline-dark text-start d-flex justify-content-between align-items-center demo-fill-btn" data-user="admin" data-pass="admin123">
                  <span><strong>Admin:</strong> admin / admin123</span>
                  <span class="badge bg-primary">Sales &amp; Inventory</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline-dark text-start d-flex justify-content-between align-items-center demo-fill-btn" data-user="supervisor" data-pass="supervisor123">
                  <span><strong>Supervisor:</strong> supervisor / supervisor123</span>
                  <span class="badge bg-warning text-dark">Production</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Demo Fill Event Listeners
    container.querySelectorAll('.demo-fill-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.getElementById('login-username').value = this.getAttribute('data-user');
        document.getElementById('login-password').value = this.getAttribute('data-pass');
        showAlert('', 'clear');
      });
    });

    // Form Submit Listener
    const form = document.getElementById('login-form');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const user = document.getElementById('login-username').value;
      const pass = document.getElementById('login-password').value;

      const res = auth.login(user, pass);
      if (res.success) {
        utils.showToast(`Welcome back, ${res.user.name}!`);
        window.location.hash = '#/dashboard';
      } else {
        showAlert(res.error, 'danger');
      }
    });

    function showAlert(msg, type) {
      const alertBox = document.getElementById('login-alert-container');
      if (type === 'clear') {
        alertBox.innerHTML = '';
        return;
      }
      alertBox.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show small py-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-1"></i> ${msg}
          <button type="button" class="btn-close py-2" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    }
  };
})(window);
