# PRD — Web-Based ERP Prototype for Endek Ayuwindy Bali

> Give this whole document to the coding agent. Build exactly what is described. If something is not specified, choose the simplest option and mention it in a short note at the end of your work.

---

## 1. Overview

**Product:** A web-based ERP **prototype** for **Endek Ayuwindy Bali**, a small Balinese endek (hand-woven fabric) business in Singaraja, Bali.

**Context:** University midterm project (Enterprise Information Systems). The prototype will be graded on: working core functions, **integration between modules**, data that is saved and can be processed, clear UI, and a demo of the full business flow from start to end.

**The business today (as-is):** Orders come by WhatsApp, are written in notebooks, thread stock is guessed from memory, prices are set by feeling, order progress is tracked by asking workers, invoices are handwritten, and the owner adds up notebooks once a month.

**Goal of the prototype:** Show one connected flow — **Order-to-Cash** — where one transaction in one module automatically changes the data in the other modules, all from one shared data store.

**Business flow (must work end to end):**
1. Customer places a custom order (Sales)
2. System checks thread and dye stock (Inventory) → rejects the order if not enough
3. Order is confirmed → production order is created automatically (Production)
4. Production starts → thread and dye stock goes down automatically (Inventory)
5. Order passes 4 stages: Thread Preparation → Dyeing → Weaving → Finishing (Production)
6. Finishing is confirmed → production cost is sent to Finance, order becomes "Ready for Delivery", invoice is created automatically (Finance)
7. Fabric is delivered (Sales)
8. Payment is recorded → invoice becomes Paid, income is recorded, profit is calculated (Finance)
9. Owner sees everything on the dashboard

## 2. Scope

### In scope
- 4 modules: **Sales & Custom Order, Inventory, Production, Finance**
- Login page with 3 roles (Owner, Admin, Supervisor)
- Dashboard with 6 widgets
- Order traceability page (one order → all linked records)
- Demo sample data + "Reset demo data" button

### Out of scope (do NOT build)
- Real backend, server, or database (no PHP, no MySQL, no Node server, no API)
- Purchasing module, HR / piece-rate wages module
- Tax calculation, woodcarving / ukiran products, packaging stage (this is an endek-only prototype with exactly 4 production stages)
- PDF/Excel export, email/WhatsApp notifications, hosting, real authentication security
- Labor cost in production cost (material cost only)

## 3. Tech Stack and Constraints

| Item | Decision |
|---|---|
| Language | Plain HTML, CSS, JavaScript (no framework, no build step, no npm) |
| UI library | Bootstrap 5.3 via CDN + Bootstrap Icons via CDN |
| Charts | Chart.js via CDN |
| Storage | **Browser `localStorage` only** (no database) |
| Routing | Single `index.html` with hash routing (`#/dashboard`, `#/sales/orders`, etc.) |
| Scripts | Normal `<script>` tags in the correct order (NOT ES modules), so it also opens by double-click or Live Server |
| Code language | **English** variable, function, and file names |
| Browser | Latest Chrome; must be usable on a phone-width screen |

**UI language:** English (the report is in English). Currency is Indonesian Rupiah, formatted like `Rp380,000`. Dates formatted like `26 Oct 2026`.

## 4. Users and Roles

Login is a simple form checked against the `users` data in localStorage. This is only a prototype, so plain-text passwords in seed data are fine. Keep the logged-in user in `sessionStorage` or in a localStorage key `session`.

| Role | Demo login | Access |
|---|---|---|
| Owner | `owner` / `owner123` | Everything, read and write. Only role that sees the "Reset demo data" button. |
| Admin | `admin` / `admin123` | Sales, Inventory (material list, stock in, stock count), Finance (invoices, payments). Dashboard. |
| Supervisor | `supervisor` / `supervisor123` | Production only (orders list, stage updates, finished goods). Can view order details read-only. Dashboard (limited widgets: orders by stage). |

Rules:
- The sidebar only shows menu items the role is allowed to open.
- If a role opens a URL it is not allowed to, redirect to the dashboard with a small warning message.
- Show the logged-in user's name and role in the top bar, plus a Logout button.

## 5. Data Model (localStorage)

**Storage rule:** Each table below is stored as its own localStorage key with prefix `erp_endek_`, e.g. `erp_endek_orders` holds a JSON array. Also store `erp_endek_counters` (an object with the last number used per table) and `erp_endek_seeded` (flag).

All 14 tables (matches the ERD in the report). Field names in `snake_case` exactly as below:

| Table | Fields |
|---|---|
| `users` | user_id, name, username, password, role |
| `customers` | customer_id, name, phone, address, customer_type (Souvenir Shop / Hotel / Homestay / Individual) |
| `products` | product_id, product_name, motif, color, price_per_meter |
| `orders` | order_id, order_code (e.g. SO-001), customer_id, order_date, due_date, status, total_amount |
| `order_items` | item_id, order_id, product_id, size, quantity_m, unit_price |
| `deliveries` | delivery_id, order_id, delivery_date, status, notes |
| `materials` | material_id, material_name, material_type (Thread / Dye), unit, current_stock, min_stock, unit_cost |
| `material_requirements` | req_id, product_id, material_id, qty_per_meter |
| `stock_movements` | movement_id, material_id, production_id (nullable), movement_type (IN / OUT / ADJUSTMENT), quantity, total_cost, movement_date, note |
| `production_orders` | production_id, production_code (e.g. PO-001), item_id, status, start_date, due_date, qty_finished, quality_note |
| `production_stages` | stage_id, production_id, user_id, stage_name, status, started_at, finished_at |
| `invoices` | invoice_id, invoice_code (e.g. INV-001), order_id, invoice_date, total_amount, status |
| `payments` | payment_id, invoice_id, payment_date, amount, method (Cash / Bank Transfer) |
| `finance_transactions` | trx_id, payment_id (nullable), production_id (nullable), movement_id (nullable), trx_type (INCOME / PRODUCTION_COST / MATERIAL_PURCHASE), amount, trx_date, description |

Notes:
- IDs are auto-increment integers per table (use the counters key). Human-readable codes (SO-001, PO-001, INV-001) are generated from the ID with zero padding.
- Foreign keys are plain ID references. Each piece of data is stored **once** and other modules refer to it by ID (no copying names or prices into other tables, except `unit_price` in `order_items`, which freezes the price at order time).
- Dates stored as ISO strings (`2026-10-26`), timestamps as ISO datetime.

### Required data layer (build this first)

Create `js/db.js` with a small helper object `db`:
- `db.all(table)` → array
- `db.find(table, id)` → record or null
- `db.where(table, predicateFn)` → array
- `db.insert(table, record)` → saves with the next ID and returns the saved record
- `db.update(table, id, changes)` → merges changes
- `db.nextCode(prefix, table)` → e.g. `SO-004`
- `db.reset()` → clears all `erp_endek_*` keys and reloads seed data
- `db.seedIfEmpty()` → loads seed data on first run

Create business-rule files (see section 6) that only talk to the data through `db`. **UI files must never edit tables directly. They must call the service functions.** This is what makes the integration real and keeps every module on the same data.

## 6. Business Rules and Integration (THE MOST IMPORTANT PART)

Put these in service files: `js/services/salesService.js`, `inventoryService.js`, `productionService.js`, `financeService.js`. Each function validates first, then writes. If validation fails, nothing is saved and a clear error message is returned.

### 6.1 Material requirement calculation
For an order, for each material:
`needed = SUM over order items of (quantity_m × qty_per_meter of that product and material)`

### 6.2 Create order (Sales → Inventory)
- Admin fills the order form (customer, due date, one or more items: product, size, meters). Unit price = product's `price_per_meter`. Total = SUM(quantity_m × unit_price).
- Before saving, run the stock check for every material needed (6.1) against `materials.current_stock`.
- **If any material is short → reject the order.** Show an error listing each short material: needed vs available, e.g. `Cotton Thread: needs 40 kg, available 25 kg`. Do not save anything.
- If enough → save order with status `Confirmed` and its items.
- Immediately and automatically create one `production_orders` row per order item with status `Waiting`, `due_date` copied from the order. Also create the 4 `production_stages` rows for it (Thread Preparation, Dyeing, Weaving, Finishing) with status `Pending`.
- Stock is not deducted yet at this point (it is deducted at production start).

### 6.3 Start production (Production → Inventory)
- Supervisor clicks "Start Production" on a production order with status `Waiting`.
- Re-check stock for that production order (stock may have changed since the order was created).
- **If not enough → block the start** and show which material is short. Status stays `Waiting`.
- If enough, in one operation:
  - For each material: insert a `stock_movements` row (type `OUT`, quantity, `total_cost = quantity × materials.unit_cost`, linked to `production_id`).
  - Reduce `materials.current_stock` by that quantity.
  - Set production status to `In Progress`, set `start_date`.
  - Set parent order status to `In Production`.
  - Set the first stage (Thread Preparation) to `In Progress` with `started_at` and the current user.

### 6.4 Update stages (Production)
- Supervisor moves an order forward one stage at a time, in fixed order: Thread Preparation → Dyeing → Weaving → Finishing. Cannot skip or go back.
- Each change saves `started_at` / `finished_at` and the `user_id` of the officer.
- When one stage is marked `Done`, the next stage becomes `In Progress`.

### 6.5 Confirm finished goods (Production → Sales + Finance)
- When Finishing is done, the supervisor enters `qty_finished` (meters) and a `quality_note`.
- Then automatically:
  - Production status → `Completed`.
  - Order status → `Ready for Delivery` (when all items of the order are completed).
  - **Production cost** = SUM of `total_cost` of the `OUT` movements of this production order. Insert a `finance_transactions` row (type `PRODUCTION_COST`, linked to `production_id`).
  - **Invoice** is created automatically: `invoices` row for the order, status `Unpaid`, total = order total.

### 6.6 Delivery (Sales)
- Admin records a delivery for an order with status `Ready for Delivery`: delivery date, notes.
- Order status → `Delivered`.

### 6.7 Payment (Finance)
- Admin opens an `Unpaid` or `Partially Paid` invoice and records a payment (date, amount, method). Amount cannot be more than the remaining balance and must be greater than 0.
- Insert `payments` row, insert `finance_transactions` row (type `INCOME`, linked to `payment_id`).
- Invoice status: `Partially Paid` if remaining balance > 0, `Paid` if balance = 0.
- When invoice is `Paid` AND the order is `Delivered` → order status becomes `Completed`.

### 6.8 Stock in (Inventory → Finance)
- Admin chooses a material, enters quantity and total cost.
- Insert `stock_movements` (type `IN`), increase `current_stock`, and update `unit_cost` = total cost ÷ quantity.
- Insert `finance_transactions` (type `MATERIAL_PURCHASE`, linked to `movement_id`).

### 6.9 Stock count / adjustment (Inventory)
- Admin enters the real quantity counted in storage per material. System calculates the difference and saves a `stock_movements` row (type `ADJUSTMENT`, quantity = the difference, can be negative) and sets `current_stock` to the real quantity. Require a short note.

### 6.10 Low stock alert
- A material is "low" when `current_stock <= min_stock`. Show a red/orange warning badge in the material list, and the count of low materials on the dashboard.

### 6.11 Profit
- **Order profit** = order `total_amount` − production cost of that order (material cost only).
- Dashboard profit = SUM of order profit for orders that have an invoice.

### 6.12 Order statuses (full lifecycle)
`Confirmed` → `In Production` → `Ready for Delivery` → `Delivered` → `Completed`

Production statuses: `Waiting` → `In Progress` → `Completed`
Invoice statuses: `Unpaid` → `Partially Paid` → `Paid`

Use consistent Bootstrap badge colors for each status across all pages.

## 7. Screens and Features

Layout: left sidebar (collapses into a hamburger menu on phone), top bar with user info and logout, main content area. Sidebar groups: Dashboard, Sales, Inventory, Production, Finance, (Owner only) Settings.

### 7.1 Login (`#/login`)
Username, password, Login button, clear error message for wrong login. Show a small "Demo accounts" hint box under the form listing the 3 demo logins.

### 7.2 Dashboard (`#/dashboard`)
Six widgets, all calculated live from the shared data:
1. **Sales this month** — total of `orders.total_amount` in the current month (card + small bar chart per month)
2. **Stock level** — list/bar of each material's current vs minimum stock, with the low-stock warning count
3. **Orders by stage/status** — chart (doughnut or bar) of orders by status, plus count of production orders per stage (Thread Preparation, Dyeing, Weaving, Finishing)
4. **Production progress / late orders** — list of orders in production with due date; mark overdue ones in red
5. **Unpaid invoices** — count and total outstanding amount, with a link to Finance
6. **Profit** — total revenue, total production cost, profit

Each widget is clickable and goes to the relevant module page.

### 7.3 Sales and Custom Order module
- **Customers** (`#/sales/customers`): table with search; add / edit customer (name, phone, address, type).
- **Orders** (`#/sales/orders`): table (code, customer, order date, due date, total, status), filter by status, search by code or customer. "New Order" button.
- **New Order** (`#/sales/orders/new`): custom order form — customer, due date, items (product with motif and color shown, size, number of meters; can add multiple items), live total, and a live **stock check panel** showing needed vs available per material before saving. Submit follows rule 6.2.
- **Order Detail** (`#/sales/orders/:id`): all order info + status timeline + **Traceability panel** (see 7.7) + "Record Delivery" button when status is `Ready for Delivery`.
- **Deliveries** (`#/sales/deliveries`): list of deliveries with date and status.

### 7.4 Inventory module
- **Materials** (`#/inventory/materials`): table with name, type, unit, current stock, min stock, cost per unit, status badge (OK / Low). Add / edit material. Low rows highlighted.
- **Stock In** (`#/inventory/stock-in`): form per rule 6.8, and a list of recent stock-ins.
- **Stock Card** (`#/inventory/stock-card/:materialId`): all movements of one material (date, type IN/OUT/ADJUSTMENT, quantity, running balance, production order code that used it).
- **Stock Count** (`#/inventory/stock-count`): per rule 6.9.

### 7.5 Production module
- **Production Orders** (`#/production/orders`): table (PO code, order code, product, motif/color, meters, due date, current stage, status). Overdue rows marked. Filter by status.
- **Production Detail** (`#/production/orders/:id`): shows order data copied from Sales (not retyped), the material requirement calculation with stock check, a visual 4-step progress bar, buttons "Start Production" and "Complete Current Stage", the stage history table (stage, status, started, finished, officer), and a finished goods form (qty finished, quality note) available when the Finishing stage is done.

### 7.6 Finance module
- **Invoices** (`#/finance/invoices`): table (code, order, customer, date, total, paid, balance, status). Filter by status. Detail view with payment history and "Record Payment" form.
- **Payments** (`#/finance/payments`): list of all payments.
- **Transactions** (`#/finance/transactions`): ledger of `finance_transactions` with date, type, amount, description, link to order. Totals for income, production cost, material purchases.
- **Profit per Order** (`#/finance/profit`): table with order, revenue, material cost, profit, margin %. Sort by margin so the owner can see which orders earn very little.

### 7.7 Order Traceability panel (important for demo)
On Order Detail, show one clear timeline/table that follows the **same order code** across modules:
Sales order → Production order(s) and stages → Stock-out movements (material, quantity, cost) → Production cost record → Invoice → Payments → Finance income records.
Each item links to its page. This proves "one order can be traced from first request to payment".

### 7.8 Settings (Owner only)
- "Reset demo data" button (with confirm dialog) that calls `db.reset()`.
- "Export data (JSON)" button is optional (nice to have).

## 8. Seed Data (sample data, clearly labeled as demo)

The sample data should make the demo flow work right away.

**Users:** 3 (see section 4). Names: Owner = "Owner Ayuwindy", Admin = "Admin Ayu", Supervisor = "Supervisor Wayan".

**Materials:**

| Name | Type | Unit | Current stock | Min stock | Unit cost |
|---|---|---|---|---|---|
| Cotton Thread | Thread | kg | 25 | 10 | Rp80,000 |
| Red Dye | Dye | kg | 4.8 | 2 | Rp150,000 |
| Indigo Dye | Dye | kg | 5.375 | 6 (so it starts LOW) | Rp175,000 |
| Yellow Dye | Dye | kg | 6 | 2 | Rp140,000 |
| Black Dye | Dye | kg | 8 | 3 | Rp130,000 |

**Products and recipes (material per meter):**

| Product | Motif | Color | Price per meter | Recipe |
|---|---|---|---|---|
| Endek Cepuk Merah | Cepuk | Red | Rp250,000 | 0.2 kg Cotton Thread + 0.02 kg Red Dye |
| Endek Sekar Jagat Biru | Sekar Jagat | Indigo | Rp275,000 | 0.2 kg Cotton Thread + 0.02 kg Indigo Dye |
| Endek Wangsul Kuning | Wangsul | Yellow | Rp260,000 | 0.2 kg Cotton Thread + 0.02 kg Yellow Dye |
| Endek Bali Hitam | Plain / Songket-style | Black | Rp230,000 | 0.2 kg Cotton Thread + 0.02 kg Black Dye |

**Customers (5):** 2 souvenir shops, 1 hotel, 1 homestay, 1 individual (fake names and phone numbers, Singaraja / Buleleng area).

**History:** Seed 2 old orders that are already `Completed` (with their production orders, stages, stock-outs, invoices, payments, and finance records) so the dashboard charts and profit table are not empty on first open. Seed 1 more order in `In Production` at the Weaving stage, and 1 invoice that is `Unpaid`. Make sure the stock numbers in the materials table stay consistent with the seeded movements (or simply set the opening stock above as the current value and seed movements only as history).

**Demo flow to verify with this data:** A new order of **20 meters of Endek Cepuk Merah** needs 4 kg Cotton Thread and 0.4 kg Red Dye → accepted (stock 25 kg and 4.8 kg). On production start: Cotton Thread 25 → 21 kg, Red Dye 4.8 → 4.4 kg. Material cost = 4 × Rp80,000 + 0.4 × Rp150,000 = **Rp380,000**. Order total = 20 × Rp250,000 = Rp5,000,000. Stock-in of 2 kg Indigo Dye at Rp175,000 per kg (total Rp350,000) → Indigo goes 5.375 → 7.375 kg and the low warning disappears, and Finance records a Rp350,000 material purchase.

Also make the **error scenario** easy to show: an order of 150 meters of any product must be rejected for not enough thread.

## 9. Validation and Error Handling

- All required fields must be filled; meters and amounts must be numbers greater than 0.
- Due date cannot be earlier than the order date.
- Order rejected on insufficient stock (6.2), production start blocked on insufficient stock (6.3), payment cannot exceed the balance (6.7), stages cannot be skipped (6.4).
- Errors are shown as clear, plain-language messages near the form (Bootstrap alert), never only in the console.
- Use a confirm dialog for destructive or irreversible actions (start production, confirm finished goods, reset data).
- Success actions show a short toast (e.g. "Production PO-004 started. Stock updated.").
- Empty tables show a friendly empty-state message.

## 10. UI / UX Requirements

- Clean, consistent layout; same page structure, button styles, and badge colors in every module.
- Visual theme inspired by Balinese textile: warm and earthy. Suggested palette: deep indigo `#1F2A5A` (sidebar/primary), terracotta `#C8553D` (accent), warm cream `#FAF6EF` (background), gold `#D9A441` (highlight). Keep text contrast readable.
- Fonts: system font stack or one Google Font for headings; keep it simple.
- Responsive: usable at phone width (sidebar collapses, tables scroll horizontally inside a container).
- Clear navigation: active menu item highlighted, breadcrumbs on detail pages.
- Number and currency formatting helper used everywhere (`formatRupiah()`, `formatDate()`).
- Keep UI effort moderate: **function and integration matter more than decoration.**

## 11. Suggested File Structure

```
erp-endek-prototype/
├── index.html              (shell: sidebar, topbar, content container, script tags)
├── css/
│   └── style.css
├── js/
│   ├── db.js               (localStorage helper, seed loader)
│   ├── seed.js             (all demo data)
│   ├── utils.js            (formatRupiah, formatDate, toast, status badges)
│   ├── auth.js             (login, logout, role check)
│   ├── router.js           (hash router + role guard)
│   ├── services/
│   │   ├── salesService.js
│   │   ├── inventoryService.js
│   │   ├── productionService.js
│   │   └── financeService.js
│   └── pages/
│       ├── login.js
│       ├── dashboard.js
│       ├── sales.js
│       ├── inventory.js
│       ├── production.js
│       ├── finance.js
│       └── settings.js
└── README.md               (how to run + demo accounts + demo script)
```

Script order in `index.html`: utils → db → seed → services → auth → pages → router.

## 12. Acceptance Criteria (test these before saying you are done)

| # | Scenario | Expected result |
|---|---|---|
| 1 | Open app first time | Seed data loads, login page appears |
| 2 | Login as each role | Sidebar and access follow section 4 |
| 3 | Create order: 20 m Endek Cepuk Merah | Accepted, status `Confirmed`, production order created automatically with 4 pending stages |
| 4 | Create order: 150 m of any product | Rejected, error shows needed vs available per material, nothing saved |
| 5 | Start production for the 20 m order | Cotton Thread 25 → 21 kg, Red Dye 4.8 → 4.4 kg, two `OUT` movements, order status `In Production` |
| 6 | Complete all 4 stages in order | Cannot skip; officer and timestamps saved |
| 7 | Confirm finished goods | Production `Completed`, order `Ready for Delivery`, production cost Rp380,000 recorded in Finance, invoice created `Unpaid` |
| 8 | Record delivery | Order status `Delivered` |
| 9 | Pay invoice partially, then fully | `Partially Paid` then `Paid`; income records created; order becomes `Completed` |
| 10 | Overpay an invoice | Blocked with error message |
| 11 | Stock in 2 kg Indigo Dye @ Rp175,000/kg | Stock 5.375 → 7.375 kg, low warning disappears, Rp350,000 purchase in Finance |
| 12 | Stock count with a different real quantity | `ADJUSTMENT` movement saved with note, stock corrected |
| 13 | Order Detail traceability panel | Shows linked production order, stages, stock movements, cost, invoice, payments |
| 14 | Dashboard | All 6 widgets update after the actions above |
| 15 | Refresh the browser | All data is still there (localStorage) |
| 16 | Owner clicks "Reset demo data" | Data returns to the seed state |
| 17 | Open on phone width | Menu collapses, pages remain usable |

## 13. Build Order (milestones)

1. `db.js`, `seed.js`, `utils.js` and the app shell (layout, sidebar, router, login, role guard)
2. Inventory module (materials list, stock in, stock card, stock count) + `inventoryService`
3. Sales module (customers, new order with stock check, order list/detail) + `salesService`
4. Production module (list, detail, start, stages, finished goods) + `productionService`
5. Finance module (invoices, payments, transactions, profit) + `financeService`
6. Traceability panel + Dashboard
7. Polish, responsive check, run all acceptance scenarios, write `README.md`

## 14. Definition of Done

- All 17 acceptance scenarios pass.
- No UI file writes directly to localStorage tables. Everything goes through `db` and the service files.
- No console errors during the demo flow.
- `README.md` explains how to open the app, the demo accounts, and the step-by-step demo script (the Order-to-Cash flow above).