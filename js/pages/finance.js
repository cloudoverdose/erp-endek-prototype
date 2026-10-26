/**
 * Finance Module Page Views: Invoices & Payment Recording, Payments List, Financial Transactions Ledger, and Profit per Order Analysis
 */

(function(window) {
  'use strict';

  // ==========================================
  // 1. INVOICES VIEW (#/finance/invoices)
  // ==========================================
  window.pageFinanceInvoices = function(params, container) {
    let currentFilter = 'ALL';

    function render() {
      const invoices = financeService.getInvoices({ status: currentFilter });
      const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);

      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold text-dark mb-1">Invoices &amp; Receivables</h2>
            <p class="text-muted small mb-0">Track order invoices, customer payments, and outstanding balances (PRD Section 7.6)</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-danger p-2">
              <i class="bi bi-exclamation-circle me-1"></i> Outstanding Balance: ${utils.formatRupiah(totalOutstanding)}
            </span>
            <select class="form-select form-select-sm" id="invoice-status-filter" style="width: auto;">
              <option value="ALL" ${currentFilter === 'ALL' ? 'selected' : ''}>All Invoice Statuses</option>
              <option value="Unpaid" ${currentFilter === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
              <option value="Partially Paid" ${currentFilter === 'Partially Paid' ? 'selected' : ''}>Partially Paid</option>
              <option value="Paid" ${currentFilter === 'Paid' ? 'selected' : ''}>Paid</option>
            </select>
          </div>
        </div>

        <div class="card-custom">
          <div class="card-header-custom">
            <h5 class="h6"><i class="bi bi-receipt-cutoff me-2 text-primary"></i>Sales Invoices</h5>
            <span class="text-muted small">${invoices.length} invoice(s)</span>
          </div>
          <div class="table-responsive">
            <table class="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Invoice Code</th>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Invoice Date</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Remaining Balance</th>
                  <th>Status</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.length === 0 ? `
                  <tr><td colspan="9" class="text-center py-4 text-muted">No invoices found.</td></tr>
                ` : invoices.map(inv => `
                  <tr>
                    <td><strong>${inv.invoice_code}</strong></td>
                    <td>
                      ${inv.order ? `
                        <a href="#/sales/orders/${inv.order.order_id}" class="text-decoration-none">
                          ${inv.order.order_code}
                        </a>
                      ` : '-'}
                    </td>
                    <td>${inv.customer ? inv.customer.name : 'Unknown Customer'}</td>
                    <td>${utils.formatDate(inv.invoice_date)}</td>
                    <td class="fw-bold text-dark">${utils.formatRupiah(inv.total_amount)}</td>
                    <td class="text-success">${utils.formatRupiah(inv.paid_amount)}</td>
                    <td class="fw-bold ${inv.balance > 0 ? 'text-danger' : 'text-muted'}">${utils.formatRupiah(inv.balance)}</td>
                    <td>${utils.getInvoiceStatusBadge(inv.status)}</td>
                    <td class="text-end">
                      ${inv.status !== 'Paid' ? `
                        <button class="btn btn-sm btn-terracotta record-pay-btn" data-id="${inv.invoice_id}">
                          <i class="bi bi-cash-coin me-1"></i> Record Payment
                        </button>
                      ` : `
                        <button class="btn btn-sm btn-outline-secondary view-pay-btn" data-id="${inv.invoice_id}">
                          <i class="bi bi-check2-circle text-success me-1"></i> Paid Detail
                        </button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payment Modal (PRD 6.7) -->
        <div class="modal fade" id="paymentModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content shadow border-0">
              <div class="modal-header">
                <h5 class="modal-title fw-bold" id="paymentModalTitle">Record Customer Payment</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <form id="payment-form">
                <div class="modal-body">
                  <div id="payment-error-alert"></div>
                  <input type="hidden" id="pay-invoice-id">

                  <div class="p-3 bg-light rounded-3 mb-3 border small">
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted">Invoice:</span>
                      <strong id="modal-inv-code">-</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted">Customer:</span>
                      <strong id="modal-cust-name">-</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted">Total Invoice:</span>
                      <strong id="modal-total-amt">-</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted">Already Paid:</span>
                      <strong class="text-success" id="modal-paid-amt">-</strong>
                    </div>
                    <div class="d-flex justify-content-between pt-1 border-top">
                      <span class="text-muted fw-bold">Remaining Balance:</span>
                      <strong class="text-danger fs-6" id="modal-balance-amt">-</strong>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Payment Amount (Rp) *</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light">Rp</span>
                      <input type="number" step="1000" min="1" class="form-control" id="pay-amount" required placeholder="0">
                    </div>
                    <div class="form-text small">Cannot exceed remaining balance. Must be greater than 0.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Payment Method *</label>
                    <select class="form-select" id="pay-method" required>
                      <option value="Bank Transfer">Bank Transfer (BCA / Mandiri / BPD Bali)</option>
                      <option value="Cash">Cash (Tunai)</option>
                    </select>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Payment Date *</label>
                    <input type="date" class="form-control" id="pay-date" value="${utils.getTodayDate()}" required>
                  </div>

                  <div class="d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-outline-secondary flex-grow-1" id="btn-pay-partial">
                      Pay Half Balance
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-success flex-grow-1" id="btn-pay-full">
                      Pay Full Balance
                    </button>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-terracotta">Confirm Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Paid History Detail Modal -->
        <div class="modal fade" id="historyModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content shadow border-0">
              <div class="modal-header">
                <h5 class="modal-title fw-bold" id="historyModalTitle">Invoice Payment History</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body" id="historyModalBody"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Status Filter listener
      document.getElementById('invoice-status-filter').addEventListener('change', function() {
        currentFilter = this.value;
        render();
      });

      // Payment Modal logic
      const payModalEl = document.getElementById('paymentModal');
      const bsPayModal = new window.bootstrap.Modal(payModalEl);
      let activeInvoice = null;

      container.querySelectorAll('.record-pay-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          activeInvoice = financeService.getInvoice(id);
          if (activeInvoice) {
            document.getElementById('pay-invoice-id').value = activeInvoice.invoice_id;
            document.getElementById('modal-inv-code').textContent = activeInvoice.invoice_code;
            document.getElementById('modal-cust-name').textContent = activeInvoice.customer ? activeInvoice.customer.name : 'Unknown';
            document.getElementById('modal-total-amt').textContent = utils.formatRupiah(activeInvoice.total_amount);
            document.getElementById('modal-paid-amt').textContent = utils.formatRupiah(activeInvoice.paid_amount);
            document.getElementById('modal-balance-amt').textContent = utils.formatRupiah(activeInvoice.balance);
            document.getElementById('pay-amount').value = activeInvoice.balance;
            document.getElementById('payment-error-alert').innerHTML = '';
            bsPayModal.show();
          }
        });
      });

      // Quick Pay Buttons
      document.getElementById('btn-pay-partial').addEventListener('click', function() {
        if (activeInvoice) {
          document.getElementById('pay-amount').value = Math.round(activeInvoice.balance / 2);
        }
      });

      document.getElementById('btn-pay-full').addEventListener('click', function() {
        if (activeInvoice) {
          document.getElementById('pay-amount').value = activeInvoice.balance;
        }
      });

      // Submit Payment
      document.getElementById('payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const invId = document.getElementById('pay-invoice-id').value;
        const amount = document.getElementById('pay-amount').value;
        const method = document.getElementById('pay-method').value;
        const date = document.getElementById('pay-date').value;

        const res = financeService.recordPayment({
          invoice_id: invId,
          amount: amount,
          method: method,
          payment_date: date
        });

        if (res.success) {
          bsPayModal.hide();
          utils.showToast(`Payment of ${utils.formatRupiah(amount)} recorded! Invoice is now ${res.invoice.status}.`);
          render();
        } else {
          // Blocked scenario (e.g. Acceptance Criteria 10 - overpay attempt)
          document.getElementById('payment-error-alert').innerHTML = `
            <div class="alert alert-danger small py-2 mb-3">
              <i class="bi bi-x-octagon-fill me-1"></i> ${res.error}
            </div>
          `;
        }
      });

      // View Paid History Modal
      const histModalEl = document.getElementById('historyModal');
      const bsHistModal = new window.bootstrap.Modal(histModalEl);

      container.querySelectorAll('.view-pay-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          const inv = financeService.getInvoice(id);
          if (inv) {
            document.getElementById('historyModalTitle').textContent = `Payment History: ${inv.invoice_code}`;
            document.getElementById('historyModalBody').innerHTML = `
              <div class="mb-3">
                <div class="small text-muted">Customer: <strong>${inv.customer ? inv.customer.name : '-'}</strong></div>
                <div class="small text-muted">Total: <strong>${utils.formatRupiah(inv.total_amount)}</strong> &bull; Status: ${utils.getInvoiceStatusBadge(inv.status)}</div>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-bordered">
                  <thead class="table-light small">
                    <tr><th>Date</th><th>Method</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    ${inv.payments.map(p => `
                      <tr>
                        <td>${utils.formatDate(p.payment_date)}</td>
                        <td>${p.method}</td>
                        <td class="text-success fw-bold">${utils.formatRupiah(p.amount)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
            bsHistModal.show();
          }
        });
      });
    }

    render();
  };

  // ==========================================
  // 2. PAYMENTS LIST VIEW (#/finance/payments)
  // ==========================================
  window.pageFinancePayments = function(params, container) {
    const payments = financeService.getPayments();
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 class="h4 fw-bold text-dark mb-1">Payment Receipts</h2>
          <p class="text-muted small mb-0">Record of all funds received from customers for endek orders</p>
        </div>
        <span class="badge bg-success p-2 fs-6">
          <i class="bi bi-wallet2 me-1"></i> Total Collected: ${utils.formatRupiah(totalCollected)}
        </span>
      </div>

      <div class="card-custom">
        <div class="card-header-custom">
          <h5 class="h6"><i class="bi bi-cash-coin me-2 text-primary"></i>Customer Receipts Log</h5>
          <span class="text-muted small">${payments.length} payment(s)</span>
        </div>
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Payment Date</th>
                <th>Invoice Code</th>
                <th>Order Code</th>
                <th>Customer</th>
                <th>Method</th>
                <th class="text-end">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              ${payments.length === 0 ? `
                <tr><td colspan="7" class="text-center py-4 text-muted">No payments recorded yet.</td></tr>
              ` : payments.map(p => `
                <tr>
                  <td><strong>#PAY-${String(p.payment_id).padStart(3, '0')}</strong></td>
                  <td>${utils.formatDate(p.payment_date)}</td>
                  <td>
                    <span class="badge bg-light text-dark border">
                      ${p.invoice ? p.invoice.invoice_code : '-'}
                    </span>
                  </td>
                  <td>
                    ${p.order ? `
                      <a href="#/sales/orders/${p.order.order_id}" class="text-decoration-none">
                        ${p.order.order_code}
                      </a>
                    ` : '-'}
                  </td>
                  <td>${p.customer ? p.customer.name : 'Unknown'}</td>
                  <td>
                    <span class="badge ${p.method === 'Cash' ? 'bg-info text-dark' : 'bg-primary'}">
                      ${p.method}
                    </span>
                  </td>
                  <td class="text-end fw-bold text-success">${utils.formatRupiah(p.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ==========================================
  // 3. TRANSACTIONS LEDGER VIEW (#/finance/transactions)
  // ==========================================
  window.pageFinanceTransactions = function(params, container) {
    let currentFilter = 'ALL';

    function render() {
      const data = financeService.getTransactions({ trx_type: currentFilter });

      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold text-dark mb-1">General Finance Ledger</h2>
            <p class="text-muted small mb-0">Unified financial ledger for revenue, production material costs, and inventory purchases</p>
          </div>
          <select class="form-select form-select-sm" id="trx-type-filter" style="width: auto;">
            <option value="ALL" ${currentFilter === 'ALL' ? 'selected' : ''}>All Transaction Types</option>
            <option value="INCOME" ${currentFilter === 'INCOME' ? 'selected' : ''}>Customer Income</option>
            <option value="PRODUCTION_COST" ${currentFilter === 'PRODUCTION_COST' ? 'selected' : ''}>Production Material Cost</option>
            <option value="MATERIAL_PURCHASE" ${currentFilter === 'MATERIAL_PURCHASE' ? 'selected' : ''}>Raw Material Purchases</option>
          </select>
        </div>

        <!-- Ledger Totals Cards -->
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <div class="card-custom p-3 border-start border-4 border-success">
              <div class="small text-muted text-uppercase fw-semibold">Total Revenue (Income)</div>
              <div class="h3 fw-bold text-success mt-1 mb-0">${utils.formatRupiah(data.totals.income)}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card-custom p-3 border-start border-4 border-danger">
              <div class="small text-muted text-uppercase fw-semibold">Total Production Cost</div>
              <div class="h3 fw-bold text-danger mt-1 mb-0">${utils.formatRupiah(data.totals.production_cost)}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card-custom p-3 border-start border-4 border-warning">
              <div class="small text-muted text-uppercase fw-semibold">Raw Material Purchases</div>
              <div class="h3 fw-bold text-warning mt-1 mb-0">${utils.formatRupiah(data.totals.material_purchase)}</div>
            </div>
          </div>
        </div>

        <div class="card-custom">
          <div class="card-header-custom">
            <h5 class="h6"><i class="bi bi-journal-check me-2 text-primary"></i>Financial Journal Entries</h5>
            <span class="text-muted small">${data.transactions.length} record(s)</span>
          </div>
          <div class="table-responsive">
            <table class="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Trx ID</th>
                  <th>Date</th>
                  <th>Transaction Type</th>
                  <th>Description</th>
                  <th>Linked Order</th>
                  <th class="text-end">Amount (Rp)</th>
                </tr>
              </thead>
              <tbody>
                ${data.transactions.length === 0 ? `
                  <tr><td colspan="6" class="text-center py-4 text-muted">No transactions found.</td></tr>
                ` : data.transactions.map(t => {
                  const isIncome = t.trx_type === 'INCOME';
                  const isProdCost = t.trx_type === 'PRODUCTION_COST';
                  const isPurchase = t.trx_type === 'MATERIAL_PURCHASE';

                  const badge = isIncome ? '<span class="badge bg-success">INCOME</span>' :
                                isProdCost ? '<span class="badge bg-danger">PRODUCTION_COST</span>' :
                                '<span class="badge bg-warning text-dark">MATERIAL_PURCHASE</span>';

                  const amountFormatted = isIncome ? `+${utils.formatRupiah(t.amount)}` : `-${utils.formatRupiah(t.amount)}`;

                  return `
                    <tr>
                      <td><strong>#TRX-${String(t.trx_id).padStart(3, '0')}</strong></td>
                      <td>${utils.formatDate(t.trx_date)}</td>
                      <td>${badge}</td>
                      <td>${t.description}</td>
                      <td>
                        ${t.linked_order_code !== '-' ? `
                          <span class="badge bg-light text-dark border">${t.linked_order_code}</span>
                        ` : '<span class="text-muted">-</span>'}
                      </td>
                      <td class="text-end fw-bold ${isIncome ? 'text-success' : 'text-danger'}">
                        ${amountFormatted}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('trx-type-filter').addEventListener('change', function() {
        currentFilter = this.value;
        render();
      });
    }

    render();
  };

  // ==========================================
  // 4. PROFIT PER ORDER VIEW (#/finance/profit)
  // ==========================================
  window.pageFinanceProfit = function(params, container) {
    let sortField = 'margin_pct';
    let sortAsc = true;

    function render() {
      let orders = financeService.getOrderProfitSummary();

      // Sort
      orders.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortAsc) return valA > valB ? 1 : -1;
        else return valA < valB ? 1 : -1;
      });

      const totalRev = orders.reduce((s, o) => s + o.revenue, 0);
      const totalCost = orders.reduce((s, o) => s + o.material_cost, 0);
      const totalProfit = totalRev - totalCost;
      const overallMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 1000) / 10 : 0;

      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold text-dark mb-1">Order Profitability Analysis</h2>
            <p class="text-muted small mb-0">Evaluate revenue against direct raw material consumption per order (PRD Section 6.11 &amp; 7.6)</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-success p-2 fs-6">
              Total Net Profit: ${utils.formatRupiah(totalProfit)} (${overallMargin}% Margin)
            </span>
          </div>
        </div>

        <div class="card-custom">
          <div class="card-header-custom flex-wrap gap-2">
            <h5 class="h6"><i class="bi bi-graph-up-arrow me-2 text-primary"></i>Profit Margin by Order</h5>
            <div class="d-flex align-items-center gap-2">
              <span class="small text-muted">Sort by:</span>
              <button class="btn btn-sm ${sortField === 'margin_pct' ? 'btn-primary-custom' : 'btn-outline-secondary'} sort-btn" data-field="margin_pct">
                Margin % ${sortField === 'margin_pct' ? (sortAsc ? '▲' : '▼') : ''}
              </button>
              <button class="btn btn-sm ${sortField === 'profit' ? 'btn-primary-custom' : 'btn-outline-secondary'} sort-btn" data-field="profit">
                Profit ${sortField === 'profit' ? (sortAsc ? '▲' : '▼') : ''}
              </button>
              <button class="btn btn-sm ${sortField === 'revenue' ? 'btn-primary-custom' : 'btn-outline-secondary'} sort-btn" data-field="revenue">
                Revenue ${sortField === 'revenue' ? (sortAsc ? '▲' : '▼') : ''}
              </button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Order Status</th>
                  <th>Invoice Status</th>
                  <th>Order Revenue</th>
                  <th>Material Cost</th>
                  <th>Gross Profit</th>
                  <th class="text-end">Margin %</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr><td colspan="8" class="text-center py-4 text-muted">No orders to calculate profit.</td></tr>
                ` : orders.map(o => `
                  <tr>
                    <td>
                      <a href="#/sales/orders/${o.order_id}" class="fw-bold text-decoration-none">
                        ${o.order_code}
                      </a>
                    </td>
                    <td>${o.customer_name}</td>
                    <td>${utils.getOrderStatusBadge(o.order_status)}</td>
                    <td>${utils.getInvoiceStatusBadge(o.invoice_status)}</td>
                    <td class="fw-bold">${utils.formatRupiah(o.revenue)}</td>
                    <td class="text-danger">-${utils.formatRupiah(o.material_cost)}</td>
                    <td class="fw-bold text-success">${utils.formatRupiah(o.profit)}</td>
                    <td class="text-end">
                      <span class="badge ${o.margin_pct >= 85 ? 'bg-success' : o.margin_pct >= 70 ? 'bg-primary' : 'bg-warning text-dark'} fs-6">
                        ${o.margin_pct}%
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const field = this.getAttribute('data-field');
          if (sortField === field) {
            sortAsc = !sortAsc;
          } else {
            sortField = field;
            sortAsc = false;
          }
          render();
        });
      });
    }

    render();
  };
})(window);
