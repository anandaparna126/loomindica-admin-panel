/* ================================================================
   LOOMINDICA — PERMISSIONS ENGINE  (permissions.js)
   ================================================================
   Include this file on EVERY admin panel page BEFORE any other
   page-specific script.

   Flow:
     1.  Admin logs in  →  login page stores token + full
         permissions object in storage.
     2.  Every page calls  PermGuard.init()  on load.
     3.  PermGuard reads permissions, updates the sidebar,
         and exposes  perm()  /  permAny()  helpers.
     4.  Page scripts call  perm('dashboard','view_revenue')
         to decide what to render.

   Storage keys (set by login page):
     adminToken        – JWT / DRF token string
     adminData         – JSON string with full admin profile:
       {
         id, name, email, role,
         permissions: {
           dashboard:    ['view_dashboard', 'view_revenue', ...],
           products:     ['view_products', 'add_product', ...],
           categories:   [...],
           inventory:    [...],
           orders:       [...],
           customers:    [...],
           transactions: [...],
           coupons:      [...],
           banners:      [...],
           reports:      [...],
           settings:     [...]
         }
       }
================================================================ */

const PermGuard = (() => {

  /* ── internal state ─────────────────────────────── */
  let _admin       = null;   // full admin object
  let _permissions = {};     // { module: Set<featureKey> }
  let _role        = '';

  /* ── sidebar module→href map ──────────────────────
     Maps each permission module to the sidebar nav link href.
     If the user has ZERO permissions in a module, the entire
     nav item (and its section label if needed) is hidden.
  ────────────────────────────────────────────────── */
  const MODULE_NAV = {
    dashboard:    'dashboard.html',
    products:     'products.html',
    categories:   'categories.html',
    inventory:    'inventory.html',
    orders:       'orders.html',
    customers:    'customers.html',
    transactions: 'transactions.html',
    coupons:      'coupons.html',
    banners:      'banners.html',
    reports:      'reports.html',
    settings:     'settings.html',
  };

  /* ── section label groupings ──────────────────────
     Used to hide entire nav section labels when all their
     child nav items are hidden.
  ────────────────────────────────────────────────── */
  const SECTION_LABELS = [
    { label: 'Main',      modules: ['dashboard'] },
    { label: 'Catalogue', modules: ['products','categories','inventory'] },
    { label: 'Sales',     modules: ['orders','customers','transactions'] },
    { label: 'Marketing', modules: ['coupons','banners'] },
    { label: 'Analytics', modules: ['reports'] },
    { label: 'System',    modules: ['settings'] },
  ];

  /* ──────────────────────────────────────────────────
     PUBLIC API
  ────────────────────────────────────────────────── */
  const pub = {

    /* ── init() ──────────────────────────────────────
       Call once at the top of every page script.
       • Reads storage (tries sessionStorage then localStorage)
       • Redirects to login if no valid session found
       • Builds internal permission sets
       • Updates sidebar visibility
       • Populates topbar user info
       Returns the admin object.
    ────────────────────────────────────────────────── */
    init(opts = {}) {
      const raw = sessionStorage.getItem('adminData') || localStorage.getItem('adminData');
      const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');

      if (!raw || !token) {
        window.location.href = opts.loginUrl || 'admin-login.html';
        return null;
      }

      try {
        _admin = JSON.parse(raw);
      } catch {
        window.location.href = opts.loginUrl || 'admin-login.html';
        return null;
      }

      _role = _admin.role || 'viewer';

      /* Build Set-based lookup for O(1) perm checks */
      _permissions = {};
      const raw_perms = _admin.permissions || {};
      for (const [mod, keys] of Object.entries(raw_perms)) {
        _permissions[mod] = new Set(Array.isArray(keys) ? keys : []);
      }

      /* Apply UI */
      this._updateTopbar();
      this._updateSidebar();
      this._applyPageGuard(opts.module, opts.loginUrl);

      return _admin;
    },

    /* ── perm(module, key) ───────────────────────────
       Returns true if the current admin has the given
       feature key inside the given module.
       Example:  perm('dashboard', 'view_revenue')
    ────────────────────────────────────────────────── */
    perm(module, key) {
      if (_role === 'superadmin') return true;       // superadmin bypasses all checks
      return !!(_permissions[module]?.has(key));
    },

    /* ── permAny(module) ─────────────────────────────
       Returns true if the admin has at least ONE permission
       in the given module.
       Example:  permAny('products')
    ────────────────────────────────────────────────── */
    permAny(module) {
      if (_role === 'superadmin') return true;
      return !!(_permissions[module]?.size > 0);
    },

    /* ── permList(module) ────────────────────────────
       Returns the Set of feature keys the admin has in a module.
    ────────────────────────────────────────────────── */
    permList(module) {
      return _permissions[module] || new Set();
    },

    /* ── getAdmin() ──────────────────────────────────
       Returns the full admin object.
    ────────────────────────────────────────────────── */
    getAdmin() { return _admin; },

    /* ── getRole() ───────────────────────────────────
       Returns the admin role string.
    ────────────────────────────────────────────────── */
    getRole() { return _role; },

    /* ── logout() ────────────────────────────────────
       Clears storage and redirects to login.
    ────────────────────────────────────────────────── */
    logout(loginUrl = 'admin-login.html') {
      ['adminToken','adminData'].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      window.location.href = loginUrl;
    },

    /* ── show(el) / hide(el) ─────────────────────────
       Convenience wrappers used by page scripts.
       el  – selector string  OR  DOM element  OR  NodeList
    ────────────────────────────────────────────────── */
    show(el) { _applyDisplay(el, true);  },
    hide(el) { _applyDisplay(el, false); },

    /* ── guard(el, module, key) ──────────────────────
       Show or hide an element based on a single permission.
       Example:
         PermGuard.guard('#exportBtn', 'dashboard', 'export_report');
    ────────────────────────────────────────────────── */
    guard(el, module, key) {
      _applyDisplay(el, this.perm(module, key));
    },

    /* ── guardAny(el, module) ────────────────────────
       Show element only if admin has any perm in the module.
    ────────────────────────────────────────────────── */
    guardAny(el, module) {
      _applyDisplay(el, this.permAny(module));
    },

    /* ── disableIfNo(el, module, key) ───────────────
       Disables (grays out) a button/input without hiding it
       when the admin lacks the permission.
    ────────────────────────────────────────────────── */
    disableIfNo(el, module, key) {
      const has = this.perm(module, key);
      const nodes = _resolve(el);
      nodes.forEach(n => {
        n.disabled = !has;
        n.style.opacity = has ? '' : '0.4';
        n.style.cursor  = has ? '' : 'not-allowed';
        n.title = has ? '' : `You don't have permission: ${key}`;
      });
    },

    /* ── renderNoAccess(containerId) ─────────────────
       Replaces the page content with a friendly "No Access"
       message when the admin has no permission for the module.
    ────────────────────────────────────────────────── */
    renderNoAccess(containerId = 'pageContent') {
      const el = typeof containerId === 'string'
        ? document.getElementById(containerId)
        : containerId;
      if (!el) return;
      el.innerHTML = `
        <div style="
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;padding:80px 24px;text-align:center;
        ">
          <div style="font-size:56px;margin-bottom:20px">🔒</div>
          <h2 style="font-size:20px;font-weight:700;color:var(--text-dark,#111);margin-bottom:8px">
            Access Restricted
          </h2>
          <p style="font-size:14px;color:var(--text-muted,#9CA3AF);max-width:340px;line-height:1.6">
            You don't have permission to view this section.
            Please contact your Super Admin to request access.
          </p>
          <div style="margin-top:20px;font-size:12px;
            background:#F3F4F6;padding:8px 16px;border-radius:20px;color:#6B7280">
            Role: <strong style="text-transform:capitalize">${_role}</strong>
          </div>
        </div>`;
    },

    /* ────────────────────────────────────────────────
       PRIVATE — Sidebar & Topbar updates
    ────────────────────────────────────────────────── */
    _updateTopbar() {
      if (!_admin) return;

      /* User avatar initials */
      const initials = (_admin.name || 'Admin')
        .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

      /* Update all avatar elements */
      document.querySelectorAll(
        '.user-avatar, .topbar-user .avatar, #saName, .sa-avatar'
      ).forEach(el => {
        if (el.id === 'saName') el.textContent = _admin.name;
        else el.textContent = initials;
      });

      /* Update name + role in topbar user dropdown */
      document.querySelectorAll('.topbar-user-info strong, .topbar-user strong').forEach(el => {
        el.textContent = _admin.name || 'Admin';
      });
      document.querySelectorAll('.topbar-user-info span, .topbar-user span').forEach(el => {
        el.textContent = _admin.role || 'Admin';
      });

      /* Sidebar footer user info */
      document.querySelectorAll('.user-info strong').forEach(el => {
        el.textContent = _admin.name || 'Admin';
      });
      document.querySelectorAll('.user-info span').forEach(el => {
        el.textContent = _admin.role || 'Admin';
      });

      /* Wire logout links */
      document.querySelectorAll('[data-logout], .logout-link').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); pub.logout(); });
      });
      /* Also wire dropdown items that contain "Logout" text */
      document.querySelectorAll('.dropdown-item.danger').forEach(el => {
        if (el.textContent.includes('Logout') || el.textContent.includes('logout')) {
          el.onclick = () => pub.logout();
        }
      });
    },

    _updateSidebar() {
      /* For each module, find its nav link and show/hide */
      for (const [module, href] of Object.entries(MODULE_NAV)) {
        const hasAny = pub.permAny(module);
        /* Match by href ending */
        const navItem = document.querySelector(
          `.sidebar .nav-link[href="${href}"], .sidebar .nav-link[href*="${href}"]`
        )?.closest('.nav-item');
        if (navItem) {
          navItem.style.display = hasAny ? '' : 'none';
        }
      }

      /* Hide section labels if ALL their modules are hidden */
      document.querySelectorAll('.sidebar .nav-section-label, .sidebar .nav-section-title').forEach(label => {
        const text = label.textContent.trim();
        const group = SECTION_LABELS.find(g => g.label === text);
        if (!group) return;
        const anyVisible = group.modules.some(m => pub.permAny(m));
        label.style.display = anyVisible ? '' : 'none';
      });
    },

    _applyPageGuard(module, loginUrl) {
      /* If a module is specified, block the page if user has no access */
      if (!module) return;
      if (!pub.permAny(module)) {
        const content = document.querySelector('.page-content, #pageContent, main');
        if (content) pub.renderNoAccess(content);
      }
    },
  };

  /* ── private helpers ──────────────────────────────── */
  function _resolve(el) {
    if (!el) return [];
    if (typeof el === 'string') return [...document.querySelectorAll(el)];
    if (el instanceof NodeList || Array.isArray(el)) return [...el];
    return [el];
  }

  function _applyDisplay(el, show) {
    _resolve(el).forEach(n => {
      if (show) {
        n.style.display = n.dataset.originalDisplay || '';
        n.removeAttribute('data-perm-hidden');
      } else {
        if (!n.hasAttribute('data-perm-hidden')) {
          n.dataset.originalDisplay = n.style.display;
        }
        n.style.display = 'none';
        n.setAttribute('data-perm-hidden', '1');
      }
    });
  }

  return pub;
})();

/* ================================================================
   SHORTHAND ALIAS — perm() / permAny()
   Use these anywhere in your page scripts for brevity.
   Example:  if (perm('dashboard','view_revenue')) { ... }
================================================================ */
const perm    = (module, key)  => PermGuard.perm(module, key);
const permAny = (module)       => PermGuard.permAny(module);