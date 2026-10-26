/**
 * Utility functions for formatting, badges, toasts, and UI dialogs
 */

window.utils = {
  /**
   * Format number as Indonesian Rupiah: Rp380,000
   */
  formatRupiah: function(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp0';
    const num = Math.round(Number(amount));
    return 'Rp' + num.toLocaleString('en-US');
  },

  /**
   * Format date as '26 Oct 2026'
   */
  formatDate: function(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Format date and time as '26 Oct 2026, 14:30'
   */
  formatDateTime: function(dateTimeStr) {
    if (!dateTimeStr) return '-';
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return dateTimeStr;
      const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${datePart}, ${timePart}`;
    } catch (e) {
      return dateTimeStr;
    }
  },

  /**
   * Get current date in ISO format YYYY-MM-DD
   */
  getTodayDate: function() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /**
   * Get current datetime in ISO format
   */
  getNowDateTime: function() {
    return new Date().toISOString();
  },

  /**
   * Status Badges consistent across modules
   */
  getOrderStatusBadge: function(status) {
    switch (status) {
      case 'Confirmed':
        return '<span class="badge bg-info text-dark"><i class="bi bi-clock me-1"></i>Confirmed</span>';
      case 'In Production':
        return '<span class="badge bg-warning text-dark"><i class="bi bi-gear-wide-connected me-1"></i>In Production</span>';
      case 'Ready for Delivery':
        return '<span class="badge bg-primary"><i class="bi bi-box-seam me-1"></i>Ready for Delivery</span>';
      case 'Delivered':
        return '<span class="badge bg-secondary"><i class="bi bi-truck me-1"></i>Delivered</span>';
      case 'Completed':
        return '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Completed</span>';
      default:
        return `<span class="badge bg-secondary">${status || 'Unknown'}</span>`;
    }
  },

  getProductionStatusBadge: function(status) {
    switch (status) {
      case 'Waiting':
        return '<span class="badge bg-secondary"><i class="bi bi-hourglass me-1"></i>Waiting</span>';
      case 'In Progress':
        return '<span class="badge bg-warning text-dark"><i class="bi bi-arrow-repeat me-1"></i>In Progress</span>';
      case 'Completed':
        return '<span class="badge bg-success"><i class="bi bi-check2-circle me-1"></i>Completed</span>';
      default:
        return `<span class="badge bg-secondary">${status || 'Unknown'}</span>`;
    }
  },

  getStageStatusBadge: function(status) {
    switch (status) {
      case 'Pending':
        return '<span class="badge bg-light text-dark border">Pending</span>';
      case 'In Progress':
        return '<span class="badge bg-warning text-dark">In Progress</span>';
      case 'Done':
        return '<span class="badge bg-success">Done</span>';
      default:
        return `<span class="badge bg-secondary">${status || 'Pending'}</span>`;
    }
  },

  getInvoiceStatusBadge: function(status) {
    switch (status) {
      case 'Unpaid':
        return '<span class="badge bg-danger"><i class="bi bi-exclamation-circle me-1"></i>Unpaid</span>';
      case 'Partially Paid':
        return '<span class="badge bg-warning text-dark"><i class="bi bi-pie-chart me-1"></i>Partially Paid</span>';
      case 'Paid':
        return '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Paid</span>';
      default:
        return `<span class="badge bg-secondary">${status || 'Unknown'}</span>`;
    }
  },

  getMaterialStockBadge: function(currentStock, minStock) {
    if (Number(currentStock) <= Number(minStock)) {
      return '<span class="badge bg-danger"><i class="bi bi-exclamation-triangle me-1"></i>Low Stock</span>';
    }
    return '<span class="badge bg-success"><i class="bi bi-check me-1"></i>In Stock</span>';
  },

  /**
   * Display floating toast notification
   */
  showToast: function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success text-white' :
                    type === 'danger' || type === 'error' ? 'bg-danger text-white' :
                    type === 'warning' ? 'bg-warning text-dark' : 'bg-primary text-white';

    const icon = type === 'success' ? 'bi-check-circle-fill' :
                 type === 'danger' || type === 'error' ? 'bi-x-circle-fill' :
                 type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 mb-2 shadow" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center">
            <i class="bi ${icon} fs-5 me-2"></i>
            <div>${message}</div>
          </div>
          <button type="button" class="btn-close ${type !== 'warning' ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    if (window.bootstrap && window.bootstrap.Toast) {
      const bsToast = new window.bootstrap.Toast(toastEl, { delay: 4000 });
      bsToast.show();
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    } else {
      setTimeout(() => toastEl.remove(), 4000);
    }
  },

  /**
   * Display confirmation modal for destructive or important actions
   */
  showConfirmModal: function(title, message, onConfirm) {
    let modalEl = document.getElementById('globalConfirmModal');
    if (!modalEl) {
      const modalHtml = `
        <div class="modal fade" id="globalConfirmModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow border-0">
              <div class="modal-header border-bottom-0 pb-0">
                <h5 class="modal-title fw-bold text-dark" id="globalConfirmModalTitle">Confirm Action</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-secondary py-3" id="globalConfirmModalBody">
                Are you sure you want to proceed?
              </div>
              <div class="modal-footer border-top-0 pt-0">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" id="globalConfirmModalBtn">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      modalEl = document.getElementById('globalConfirmModal');
    }

    document.getElementById('globalConfirmModalTitle').textContent = title;
    document.getElementById('globalConfirmModalBody').innerHTML = message;

    const confirmBtn = document.getElementById('globalConfirmModalBtn');
    const bsModal = new window.bootstrap.Modal(modalEl);

    // Clone button to remove previous listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', function() {
      bsModal.hide();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    });

    bsModal.show();
  }
};
