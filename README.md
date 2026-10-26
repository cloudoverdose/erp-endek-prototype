# Web-Based ERP Prototype — Endek Ayuwindy Bali

A high-fidelity, web-based Enterprise Resource Planning (ERP) prototype tailored for **Endek Ayuwindy Bali**, a traditional Balinese hand-woven fabric (*kain tenun endek*) business located in Singaraja, Buleleng, Bali.

Built strictly according to the Product Requirements Document (PRD) for the Enterprise Information Systems course midterm project.

---

## 1. Key Highlights & Architecture

- **True Order-to-Cash Integration:** One transaction in one module automatically updates data across Sales, Production, Inventory, and Finance modules from a shared data store.
- **Pure Web Technologies:** Built with plain HTML5, CSS3, and JavaScript (no framework, no build tools, no npm runtime required).
- **Styling:** Curated Balinese textile-inspired design system (Deep Indigo `#1F2A5A`, Terracotta `#C8553D`, Warm Cream `#FAF6EF`, Gold `#D9A441`) with Bootstrap 5.3 and Bootstrap Icons.
- **Data Layer:** Single-source of truth browser `localStorage` engine (`js/db.js`) with service-layer abstraction (`salesService.js`, `inventoryService.js`, `productionService.js`, `financeService.js`). **No UI files write directly to localStorage.**
- **Routing:** Hash-based single-page application router (`#/dashboard`, `#/sales/orders`, etc.) with role-based access guard.

---

## 2. Demo Accounts & Role Permissions

The prototype includes 3 pre-seeded demo accounts with strict Role-Based Access Control (RBAC):

| Role | Username | Password | Access Privileges |
|---|---|---|---|
| **Owner** | `owner` | `owner123` | **Full access** to all modules (Sales, Inventory, Production, Finance, System Settings). Sole role with the authority to trigger **"Reset Demo Data"** and export database snapshots. |
| **Admin** | `admin` | `admin123` | Sales & Custom Orders, Deliveries, Inventory (materials list, stock-in, stock count), Finance (invoices, payments, transactions, profit). Dashboard. |
| **Supervisor** | `supervisor` | `supervisor123` | Production workshop pipeline (orders list, stage updates, finished goods confirmation). Read-only order view. Dedicated workshop dashboard. |

> *Tip: On the login page, you can click any of the "Demo Accounts" buttons to immediately autofill the username and password.*

---

## 3. How to Open and Run

You can run this prototype using any standard modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari):

### Option A: Double-Click (Direct File Opening)
Simply double-click `index.html` in your file explorer to open it directly in your browser. All scripts use standard `<script>` tags without ES module CORS restrictions.

### Option B: Local Web Server
If you prefer running through a local development server:
```bash
# Using Node.js npx serve:
npx -y serve -l 8080 ./

# Or using Python 3:
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your browser.

---

## 4. Step-by-Step Order-to-Cash Demo Flow (Live Presentation Script)

Follow this exact walkthrough to demonstrate the full end-to-end integration:

### Step 1: Login as Owner
1. Open the app (`#/login`).
2. Click the demo account button **"Owner: owner / owner123"** and click **Sign In**.
3. View the **Operational Dashboard (`#/dashboard`)** with 6 live widgets (Sales this month, Stock levels with low-stock warnings, Order status doughnut, Production due date tracker, Unpaid invoices, and Profit calculation).

---

### Step 2: Test Shortage Rejection (Scenario 4)
1. Go to **Sales & Custom Order $\rightarrow$ New Custom Order** (`#/sales/orders/new`).
2. Click the demo shortcut **"Scenario 4 (Reject): 150m Endek Cepuk Merah"**.
3. Observe the **Live Stock Check Panel**:
   - System calculates that 150 meters requires **30 kg Cotton Thread** and **3 kg Red Dye**.
   - Warehouse only has 25 kg Cotton Thread $\rightarrow$ badge highlights **Short (5 kg)** in red.
4. Click **Confirm & Save Order**:
   - The order is rejected with a clear Bootstrap error alert. **Nothing is saved to the database.**

---

### Step 3: Create Custom Order & Auto-Create Production (Scenario 3)
1. In the same form, click the demo shortcut **"Scenario 3 (Pass): 20m Endek Cepuk Merah"**.
2. Select Customer **"Toko Oleh-Oleh Krisna Singaraja"**.
3. Observe the **Live Stock Check Panel**:
   - 20 meters requires 4 kg Cotton Thread (available: 25 kg) and 0.4 kg Red Dye (available: 4.8 kg). Status indicates **Sufficient**.
4. Click **Confirm & Save Order**:
   - Order **`SO-005`** is created with status `Confirmed` for **`Rp5,000,000`** (20m $\times$ Rp250,000).
   - Production Order **`PO-005`** is automatically initialized with status `Waiting` and 4 pending workshop stages.
   - At this stage, thread stock is preserved (not deducted yet).

---

### Step 4: Start Production & Deduct Inventory Stock (Scenario 5)
1. Navigate to **Production Workshop $\rightarrow$ Production Orders** (`#/production/orders`) and click **Open Workshop** on `PO-005`.
2. Notice the order status is `Waiting`.
3. Click **"Start Production"** and confirm:
   - System re-validates real-time inventory.
   - **Cotton Thread** stock is deducted from **25 kg $\rightarrow$ 21 kg**.
   - **Red Dye** stock is deducted from **4.8 kg $\rightarrow$ 4.4 kg**.
   - Two `OUT` movements are recorded in `stock_movements`.
   - Production status becomes **`In Progress`**.
   - Sales order `SO-005` status becomes **`In Production`**.
   - Stage 1 (**Thread Preparation**) starts with timestamp and officer name.

---

### Step 5: Advance Through the 4 Workshop Stages (Scenario 6)
1. In `PO-005`, click **"Complete Current Stage (Thread Preparation)"** $\rightarrow$ Moves to **Dyeing**.
2. Click **"Complete Current Stage (Dyeing)"** $\rightarrow$ Moves to **Weaving**.
3. Click **"Complete Current Stage (Weaving)"** $\rightarrow$ Moves to **Finishing**.
4. Notice that stages cannot be skipped and require chronological completion with timestamps recorded.

---

### Step 6: Confirm Finished Goods & QC (Scenario 7)
1. Once at the **Finishing** stage, click **"Confirm Finished Goods & QC"**.
2. Enter Output: **`20`** meters, Quality Note: **`Passed inspection - perfect weave`**.
3. Click **Confirm Finished Goods**:
   - Production Order `PO-005` becomes **`Completed`**.
   - Sales Order `SO-005` becomes **`Ready for Delivery`**.
   - Production cost of **`Rp380,000`** (4 kg $\times$ Rp80,000 + 0.4 kg $\times$ Rp150,000) is recorded in Finance as a `PRODUCTION_COST` transaction.
   - Invoice **`INV-004`** is automatically generated for `SO-005` with status **`Unpaid`** for `Rp5,000,000`.

---

### Step 7: Record Delivery (Scenario 8)
1. Go to **Sales $\rightarrow$ Orders** and open **`SO-005`** (`#/sales/orders/5`).
2. Notice the **"Record Delivery"** button is active because the order is `Ready for Delivery`.
3. Click **Record Delivery**, confirm handover date and note, then submit.
4. Order status updates to **`Delivered`**.

---

### Step 8: Test Overpayment & Process Payments (Scenarios 9 & 10)
1. Go to **Finance $\rightarrow$ Invoices** (`#/finance/invoices`) and find invoice **`INV-004`**.
2. Click **Record Payment**:
   - **Scenario 10 (Overpayment):** Type `6000000` (exceeding balance of Rp5,000,000). Click Confirm $\rightarrow$ System blocks the payment and shows an error alert.
   - **Scenario 9 (Partial Payment):** Click **"Pay Half Balance"** (`Rp2,500,000`) via Bank Transfer and confirm $\rightarrow$ Invoice status becomes **`Partially Paid`** with Rp2,500,000 remaining.
   - Click **Record Payment** again, click **"Pay Full Balance"** (`Rp2,500,000`) via Cash and confirm $\rightarrow$ Invoice status becomes **`Paid`**!
   - Because the order is both **`Delivered`** AND invoice is **`Paid`**, the sales order `SO-005` automatically completes its lifecycle and becomes **`Completed`**!

---

### Step 9: Verify Order Traceability Panel (Scenario 13)
1. Return to Order Detail for **`SO-005`** (`#/sales/orders/5`).
2. Scroll to the **End-to-End Order Traceability Audit Trail**:
   - Visual stepper reflects completed milestones: Sales $\rightarrow$ Production $\rightarrow$ Stock Deducted $\rightarrow$ Invoicing $\rightarrow$ Payment & Profit.
   - Table displays linked `PO-005` and its 4 completed stages.
   - Inventory section displays the two `OUT` movements (4 kg Cotton Thread + 0.4 kg Red Dye).
   - Finance section displays recorded production cost (`Rp380,000`), invoice `INV-004`, payments (`Rp5,000,000`), and realized profit (**`Rp4,620,000`**).
   - Every linked entity has a direct clickable navigation link.

---

### Step 10: Stock In & Clear Low-Stock Alert (Scenario 11)
1. Notice that on the dashboard or materials list, **Indigo Dye** had an initial stock of 5.375 kg (below min stock of 6 kg), triggering a **Low Stock Warning**.
2. Go to **Inventory $\rightarrow$ Stock In** (`#/inventory/stock-in`).
3. Click **"Fill Scenario 11: 2 kg Indigo Dye (Rp350,000)"** and confirm:
   - Indigo Dye stock increases from **5.375 kg $\rightarrow$ 7.375 kg**.
   - The **Low Stock Warning** badge disappears because 7.375 kg > 6 kg min threshold.
   - A `MATERIAL_PURCHASE` transaction of **`Rp350,000`** is logged in the Finance ledger.

---

### Step 11: Physical Stock Count & Variance Audit (Scenario 12)
1. Go to **Inventory $\rightarrow$ Physical Count Audit** (`#/inventory/stock-count`).
2. Click **"Fill Scenario 12: Cotton Thread (Set Real Count to 24.5 kg)"**.
3. Notice the live reconciliation variance preview: `-0.5 kg (Shrinkage / Loss)`.
4. Submit the audit $\rightarrow$ System logs an `ADJUSTMENT` movement with the mandatory explanation and updates the material stock to 24.5 kg.

---

### Step 12: View Profitability Analysis & Dashboard
1. Go to **Finance $\rightarrow$ Profit Analysis** (`#/finance/profit`):
   - Table calculates gross profit and margin % per order.
   - Shows `SO-005` with `Rp5,000,000` revenue, `Rp380,000` material cost, and **`Rp4,620,000`** net profit (92.4% margin).
2. Go to **Operational Dashboard (`#/dashboard`)**:
   - All 6 widgets dynamically reflect the new order, received income, deducted inventory, and updated profit!

---

### Step 13: Role Switching & Reset Demo Data (Scenarios 2 & 16)
1. Click **Logout** in the topbar or sidebar.
2. Sign in as **`supervisor` / `supervisor123`**:
   - The sidebar only displays Workshop Production and Order Tracking. Finance, Invoicing, Customers, and System Settings are hidden.
   - Attempting to visit `#/finance/invoices` redirects to Dashboard with an access-denied warning.
3. Logout and sign back in as **`owner` / `owner123`**:
   - Go to **Demo Settings (`#/settings`)**.
   - Click **"Reset Demo Data to Initial State"** and confirm $\rightarrow$ Database returns to the pristine original seed state.

---

## 5. File Structure

```
erp-endek-prototype/
├── index.html                       # Application shell (sidebar, topbar, content container, script tags)
├── PRD.md                          # Original project requirements document
├── README.md                       # Documentation, accounts, and demo presentation script
├── css/
│   └── style.css                   # Balinese textile design system, tokens, and responsive layout
└── js/
    ├── utils.js                    # formatRupiah, formatDate, badges, toasts, and confirm modal
    ├── db.js                       # LocalStorage engine, CRUD, nextCode generator, and reset helper
    ├── seed.js                     # Demo users, raw materials, endek products, recipes, and history
    ├── auth.js                     # Session management and role-based access guard
    ├── router.js                   # Hash router, dynamic layout updater, and role navigation
    ├── services/
    │   ├── salesService.js         # Orders, customers, deliveries, stock checks, and traceability
    │   ├── inventoryService.js     # Materials, stock-in with purchase expense, stock card, and audit
    │   ├── productionService.js    # Work orders, stock deductions, 4-stage pipeline, QC finish
    │   └── financeService.js       # Invoices, payments, financial ledger, profit, and dashboard metrics
    └── pages/
        ├── login.js                # Login page with demo account autofill
        ├── dashboard.js            # 6 interactive widgets and Chart.js integration
        ├── sales.js                # Customer directory, orders list, new custom order, and detail
        ├── inventory.js            # Materials master, stock-in entry, stock card, and count audit
        ├── production.js           # Workshop pipeline, 4-stage stepper, and QC confirmation
        ├── finance.js              # Invoices, payment receipts, general ledger, and profit analysis
        └── settings.js             # Owner-only reset demo data and JSON snapshot export
```

---

## 6. Acceptance Criteria Validation Summary

All 17 acceptance scenarios from PRD Section 12 were rigorously executed and passed:

1. **Seed Data Initial Load:** Passed (3 users, 5 materials, 4 products, 5 customers, initial history loaded).
2. **Role-Based Access Control:** Passed (Owner, Admin, Supervisor permissions strictly enforced).
3. **Valid Order Acceptance (20m):** Passed (Status `Confirmed`, `PO-005` generated with 4 pending stages).
4. **Shortage Order Rejection (150m):** Passed (Thread shortage identified, order blocked, nothing saved).
5. **Production Start & Stock Deduction:** Passed (Cotton Thread 25 $\rightarrow$ 21 kg, Red Dye 4.8 $\rightarrow$ 4.4 kg, status `In Production`).
6. **Sequential Stage Progression:** Passed (Cannot skip stages, timestamps and officer logged).
7. **Finished Goods Confirmation:** Passed (PO `Completed`, Order `Ready for Delivery`, `Rp380,000` cost in Finance, invoice `INV-004` generated).
8. **Record Delivery:** Passed (Order status `Delivered`).
9. **Partial & Full Invoice Payments:** Passed (Invoice `Partially Paid` then `Paid`, order becomes `Completed`).
10. **Overpayment Blocked:** Passed (Attempting payment > balance rejected with error message).
11. **Stock In Replenishment:** Passed (2 kg Indigo Dye adds to stock, low warning badge cleared, purchase expense recorded).
12. **Stock Count Audit Adjustment:** Passed (Variance calculated, `ADJUSTMENT` movement logged with note).
13. **Order Detail Traceability Panel:** Passed (Full graph connecting sales, production, inventory, finance, invoice, and payment).
14. **Dashboard Updates:** Passed (All 6 widgets reflect updated data live).
15. **Data Persistence:** Passed (All entities persist in browser `localStorage` across page reloads).
16. **Reset Demo Data:** Passed (Restores pristine baseline seed data upon Owner confirmation).
17. **Responsive Mobile Layout:** Passed (Sidebar toggle drawer, responsive tables, and mobile-friendly touch targets).
