/**
 * Authentication and Role-based Access Control
 */

(function(window) {
  'use strict';

  const SESSION_KEY = 'erp_endek_session';

  const auth = {
    /**
     * Get currently logged in user or null
     */
    getCurrentUser: function() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Check if user is logged in
     */
    isAuthenticated: function() {
      return !!this.getCurrentUser();
    },

    /**
     * Login with username and password
     */
    login: function(username, password) {
      if (!username || !password) {
        return { success: false, error: 'Please enter both username and password.' };
      }

      const users = db.all('users');
      const found = users.find(u => u.username === username.trim() && u.password === password);

      if (!found) {
        return { success: false, error: 'Invalid username or password. Check demo credentials.' };
      }

      // Store in session
      const sessionUser = {
        user_id: found.user_id,
        name: found.name,
        username: found.username,
        role: found.role
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

      return { success: true, user: sessionUser };
    },

    /**
     * Logout user and clear session
     */
    logout: function() {
      localStorage.removeItem(SESSION_KEY);
      window.location.hash = '#/login';
    },

    /**
     * Check if current user is allowed to access route (PRD Section 4)
     */
    canAccess: function(route) {
      const user = this.getCurrentUser();
      if (!user) return false;

      const role = user.role;
      if (role === 'Owner') return true; // Owner can access everything

      // Clean route
      const cleanRoute = route.split('?')[0];

      if (cleanRoute === '#/dashboard') return true;

      if (role === 'Admin') {
        // Admin: Sales, Inventory, Finance, Dashboard
        if (cleanRoute.startsWith('#/sales') ||
            cleanRoute.startsWith('#/inventory') ||
            cleanRoute.startsWith('#/finance')) {
          return true;
        }
        return false;
      }

      if (role === 'Supervisor') {
        // Supervisor: Production only, plus read-only view of order detail
        if (cleanRoute.startsWith('#/production')) return true;
        if (/^#\/sales\/orders\/\d+$/.test(cleanRoute)) return true; // Read-only order detail
        return false;
      }

      return false;
    }
  };

  window.auth = auth;
})(window);
