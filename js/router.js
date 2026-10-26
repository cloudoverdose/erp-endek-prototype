/**
 * Client-Side Hash Router with Role-Based Guard and Layout Controller
 */

(function(window) {
  'use strict';

  const routes = [];

  const router = {
    addRoute: function(pattern, handler, title, breadcrumbs) {
      routes.push({ pattern, handler, title, breadcrumbs });
    },

    navigate: function(hash) {
      window.location.hash = hash;
    },

    init: function() {
      window.addEventListener('hashchange', () => this.handleRoute());
      // Handle initial load
      this.handleRoute();
    },

    handleRoute: function() {
      const fullHash = window.location.hash || '#/dashboard';
      const cleanHash = fullHash.split('?')[0];

      // 1. Check authentication
      const user = auth.getCurrentUser();
      if (!user && cleanHash !== '#/login') {
        window.location.hash = '#/login';
        return;
      }

      if (user && cleanHash === '#/login') {
        window.location.hash = '#/dashboard';
        return;
      }

      // 2. Check role authorization
      if (user && !auth.canAccess(cleanHash)) {
        utils.showToast(`Access denied: Your role (${user.role}) cannot open this page.`, 'warning');
        window.location.hash = '#/dashboard';
        return;
      }

      // 3. Match route
      let matchedRoute = null;
      let params = {};

      for (let i = 0; i < routes.length; i++) {
        const r = routes[i];
        // Convert route pattern e.g. '#/sales/orders/:id' to regex
        const paramNames = [];
        const regexPattern = r.pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
          paramNames.push(name);
          return '([^\\/]+)';
        });

        const regex = new RegExp(`^${regexPattern}$`);
        const match = cleanHash.match(regex);

        if (match) {
          matchedRoute = r;
          paramNames.forEach((name, idx) => {
            params[name] = match[idx + 1];
          });
          break;
        }
      }

      // Default fallback to dashboard or 404
      if (!matchedRoute) {
        if (user) {
          window.location.hash = '#/dashboard';
          return;
        } else {
          window.location.hash = '#/login';
          return;
        }
      }

      // 4. Update Shell (Sidebar, Topbar, Content)
      this.updateLayout(cleanHash, user, matchedRoute.title, matchedRoute.breadcrumbs);

      // 5. Render Page View
      const contentContainer = document.getElementById('main-content');
      if (contentContainer && typeof matchedRoute.handler === 'function') {
        matchedRoute.handler(params, contentContainer);
      }

      // Scroll to top
      window.scrollTo(0, 0);
    },

    updateLayout: function(currentRoute, user, pageTitle, breadcrumbs) {
      const sidebar = document.getElementById('sidebar');
      const topbar = document.getElementById('topbar');
      const mainWrapper = document.getElementById('main-wrapper');

      if (!user || currentRoute === '#/login') {
        if (sidebar) sidebar.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
        if (mainWrapper) mainWrapper.style.marginLeft = '0';
        return;
      }

      if (sidebar) sidebar.style.display = 'flex';
      if (topbar) topbar.style.display = 'flex';
      if (mainWrapper) mainWrapper.style.marginLeft = '';

      // Update User Badge in Topbar & Sidebar
      const userNameEls = document.querySelectorAll('.current-user-name');
      userNameEls.forEach(el => el.textContent = user.name);

      const userRoleEls = document.querySelectorAll('.current-user-role');
      userRoleEls.forEach(el => {
        el.textContent = user.role;
        el.className = 'user-role-badge ' + (
          user.role === 'Owner' ? 'bg-danger text-white' :
          user.role === 'Supervisor' ? 'bg-warning text-dark' : 'bg-primary text-white'
        );
      });

      const userAvatarEls = document.querySelectorAll('.current-user-avatar');
      userAvatarEls.forEach(el => {
        el.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      });

      // Update Topbar Breadcrumb & Title
      const breadcrumbEl = document.getElementById('topbar-breadcrumb');
      if (breadcrumbEl) {
        if (breadcrumbs && breadcrumbs.length) {
          breadcrumbEl.innerHTML = breadcrumbs.map((bc, idx) => {
            if (idx === breadcrumbs.length - 1) {
              return `<span class="text-dark">${bc.label}</span>`;
            }
            return `<a href="${bc.link}" class="text-muted text-decoration-none me-1">${bc.label}</a> <span class="text-muted me-1">/</span>`;
          }).join('');
        } else {
          breadcrumbEl.textContent = pageTitle || 'Dashboard';
        }
      }

      // Update Sidebar Menus according to Role
      this.renderSidebarMenu(user.role, currentRoute);
    },

    renderSidebarMenu: function(role, currentRoute) {
      const menuContainer = document.getElementById('sidebar-menu-items');
      if (!menuContainer) return;

      const items = [];

      // Dashboard: All roles
      items.push({
        group: 'Main',
        items: [
          { label: 'Dashboard', icon: 'bi-grid-1x2-fill', link: '#/dashboard' }
        ]
      });

      // Sales: Owner, Admin
      if (role === 'Owner' || role === 'Admin') {
        items.push({
          group: 'Sales & Custom Order',
          items: [
            { label: 'Orders', icon: 'bi-cart-check-fill', link: '#/sales/orders' },
            { label: 'New Custom Order', icon: 'bi-plus-circle-fill', link: '#/sales/orders/new' },
            { label: 'Customers', icon: 'bi-people-fill', link: '#/sales/customers' },
            { label: 'Deliveries', icon: 'bi-truck', link: '#/sales/deliveries' }
          ]
        });
      }

      // Inventory: Owner, Admin
      if (role === 'Owner' || role === 'Admin') {
        items.push({
          group: 'Inventory Management',
          items: [
            { label: 'Materials & Stock', icon: 'bi-box-seam-fill', link: '#/inventory/materials' },
            { label: 'Stock In', icon: 'bi-box-arrow-in-down', link: '#/inventory/stock-in' },
            { label: 'Stock Count / Audit', icon: 'bi-clipboard-check-fill', link: '#/inventory/stock-count' }
          ]
        });
      }

      // Production: Owner, Supervisor
      if (role === 'Owner' || role === 'Supervisor') {
        items.push({
          group: 'Production Pipeline',
          items: [
            { label: 'Production Orders', icon: 'bi-gear-wide-connected', link: '#/production/orders' }
          ]
        });
      }

      // Finance: Owner, Admin
      if (role === 'Owner' || role === 'Admin') {
        items.push({
          group: 'Finance & Invoicing',
          items: [
            { label: 'Invoices', icon: 'bi-receipt-cutoff', link: '#/finance/invoices' },
            { label: 'Payments', icon: 'bi-cash-coin', link: '#/finance/payments' },
            { label: 'Transactions Ledger', icon: 'bi-journal-text', link: '#/finance/transactions' },
            { label: 'Profit Analysis', icon: 'bi-graph-up-arrow', link: '#/finance/profit' }
          ]
        });
      }

      // Settings: Owner only
      if (role === 'Owner') {
        items.push({
          group: 'System',
          items: [
            { label: 'Demo Settings', icon: 'bi-sliders', link: '#/settings' }
          ]
        });
      }

      let html = '';
      items.forEach(grp => {
        html += `<div class="menu-group-title">${grp.group}</div>`;
        grp.items.forEach(it => {
          const isActive = currentRoute === it.link ||
            (it.link !== '#/dashboard' && currentRoute.startsWith(it.link));
          html += `
            <a href="${it.link}" class="nav-link-custom ${isActive ? 'active' : ''}">
              <i class="bi ${it.icon}"></i>
              <span>${it.label}</span>
            </a>
          `;
        });
      });

      menuContainer.innerHTML = html;
    }
  };

  window.router = router;
})(window);
