/* =============================================
   LOOMINDICA ADMIN - CORE JAVASCRIPT
   ============================================= */

// ── API Configuration ──────────────────────────────
const API_CONFIG = {
  // BASE: 'http://192.168.29.60:8000/api/v1', // Standardized with frontend
  // BASE: 'http://192.168.29.60:8000/api',    // Keeping current base but making it easily swappable
  TOKEN_PREFIX: 'Token',                     // Django REST Framework default
   BASE: 'http://34.231.15.242:8001/api',
  TOKEN_KEY: 'adminToken'
};

const API = {
  base: API_CONFIG.BASE,
  getToken: () => localStorage.getItem(API_CONFIG.TOKEN_KEY) || '',

  async get(endpoint) {
    const res = await fetch(`${this.base}${endpoint}`, { 
      headers: { 'Authorization': `${API_CONFIG.TOKEN_PREFIX} ${this.getToken()}` } 
    });
    console.log(`GET ${endpoint} →`, res);
    return res.json();
  },

  async post(endpoint, data) {
    console.log(`POST ${endpoint}`, data);
    const options = {
      method: 'POST',
      headers: { 
        'Authorization': `${API_CONFIG.TOKEN_PREFIX} ${this.getToken()}`
      }
    };
    
    // If data is FormData, don't set Content-Type (let browser set boundary)
    if (data instanceof FormData) {
      options.body = data;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }

    const res = await fetch(`${this.base}${endpoint}`, options);
    console.log(`POST ${endpoint} →`, res);
    return res.json();
  },

  async put(endpoint, data) {
    console.log(`PUT ${endpoint}`, data);
    const res = await fetch(`${this.base}${endpoint}`, { 
      method: 'PUT', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `${API_CONFIG.TOKEN_PREFIX} ${this.getToken()}` 
      }, 
      body: JSON.stringify(data) 
    });
    console.log(`PUT ${endpoint} →`, res);
    return res.json();
  },

  async delete(endpoint) {
    console.log(`DELETE ${endpoint}`);
    const res = await fetch(`${this.base}${endpoint}`, { 
      method: 'DELETE', 
      headers: { 'Authorization': `${API_CONFIG.TOKEN_PREFIX} ${this.getToken()}` } 
    });
    console.log(`DELETE ${endpoint} →`, res);
    return res.json();
  }
};

// ── Mock Data ────────────────────────────────────
const MockData = {
  '/dashboard': {
    stats: {
      revenue: '₹4,82,350', revenue_change: '+18.4%', revenue_up: true,
      orders: '1,284', orders_change: '+9.2%', orders_up: true,
      products: '348', products_change: '+5', products_up: true,
      customers: '2,947', customers_change: '+12.6%', customers_up: true,
      pending_orders: 24, low_stock: 8
    },
    recent_orders: [
      { id: 'ORD-2401', customer: 'Priya Sharma', product: 'Madhubani Saree', amount: '₹3,450', status: 'delivered', date: '23 Apr 2026' },
      { id: 'ORD-2400', customer: 'Anjali Verma', product: 'Chanderi Silk Set', amount: '₹5,800', status: 'shipped', date: '23 Apr 2026' },
      { id: 'ORD-2399', customer: 'Kavita Singh', product: 'Block Print Kurta', amount: '₹1,950', status: 'pending', date: '22 Apr 2026' },
      { id: 'ORD-2398', customer: 'Meera Patel', product: 'Gond Art Dupatta', amount: '₹2,200', status: 'processing', date: '22 Apr 2026' },
      { id: 'ORD-2397', customer: 'Sunita Rao', product: 'Kolkata Silk Saree', amount: '₹7,500', status: 'cancelled', date: '21 Apr 2026' },
    ],
    top_products: [
      { name: 'Madhubani Saree', sales: 84, revenue: '₹2,90,000', stock: 23 },
      { name: 'Chanderi Silk', sales: 72, revenue: '₹4,17,600', stock: 14 },
      { name: 'Gond Art Dupatta', sales: 61, revenue: '₹1,34,200', stock: 37 },
      { name: 'Block Print Kurta', sales: 55, revenue: '₹1,07,250', stock: 52 },
    ]
  },
  '/products': {
    total: 348, page: 1, pages: 35,
    items: [
      { id: 1, name: 'Madhubani Saree', sku: 'SAR-001', category: 'Saree', price: '₹3,450', mrp: '₹4,500', stock: 23, status: 'active', image: 'https://via.placeholder.com/48x48/EDE9FE/7C3AED?text=S' },
      { id: 2, name: 'Chanderi Silk Saree', sku: 'SAR-002', category: 'Silk Saree', price: '₹5,800', mrp: '₹7,200', stock: 14, status: 'active', image: 'https://via.placeholder.com/48x48/FEF3C7/F59E0B?text=S' },
      { id: 3, name: 'Block Print Kurta', sku: 'KUR-001', category: 'Kurta', price: '₹1,950', mrp: '₹2,500', stock: 52, status: 'active', image: 'https://via.placeholder.com/48x48/D1FAE5/10B981?text=K' },
      { id: 4, name: 'Gond Art Dupatta', sku: 'DUP-001', category: 'Dupatta', price: '₹2,200', mrp: '₹2,800', stock: 37, status: 'active', image: 'https://via.placeholder.com/48x48/DBEAFE/3B82F6?text=D' },
      { id: 5, name: 'Kolkata Silk Saree', sku: 'SAR-003', category: 'Silk Saree', price: '₹7,500', mrp: '₹9,000', stock: 8, status: 'low_stock', image: 'https://via.placeholder.com/48x48/EDE9FE/7C3AED?text=S' },
      { id: 6, name: 'Wolf Print Saree', sku: 'SAR-004', category: 'Printed Saree', price: '₹2,800', mrp: '₹3,500', stock: 0, status: 'out_of_stock', image: 'https://via.placeholder.com/48x48/FEE2E2/EF4444?text=S' },
      { id: 7, name: 'Camel Print Saree', sku: 'SAR-005', category: 'Printed Saree', price: '₹2,200', mrp: '₹2,800', stock: 19, status: 'active', image: 'https://via.placeholder.com/48x48/FEF3C7/F59E0B?text=S' },
      { id: 8, name: 'Hand Painted Stole', sku: 'STO-001', category: 'Stoles', price: '₹1,100', mrp: '₹1,400', stock: 45, status: 'active', image: 'https://via.placeholder.com/48x48/D1FAE5/10B981?text=S' },
    ]
  },
  '/orders': {
    total: 1284, pending: 24, shipped: 87, delivered: 1093, cancelled: 68, returned: 12,
    items: [
      { id: 'ORD-2401', customer: 'Priya Sharma', phone: '+91 9876543210', items: 2, amount: '₹3,450', payment: 'Online', status: 'delivered', date: '23 Apr 2026' },
      { id: 'ORD-2400', customer: 'Anjali Verma', phone: '+91 9876543211', items: 1, amount: '₹5,800', payment: 'Online', status: 'shipped', date: '23 Apr 2026' },
      { id: 'ORD-2399', customer: 'Kavita Singh', phone: '+91 9876543212', items: 3, amount: '₹1,950', payment: 'COD', status: 'pending', date: '22 Apr 2026' },
      { id: 'ORD-2398', customer: 'Meera Patel', phone: '+91 9876543213', items: 1, amount: '₹2,200', payment: 'Online', status: 'processing', date: '22 Apr 2026' },
      { id: 'ORD-2397', customer: 'Sunita Rao', phone: '+91 9876543214', items: 2, amount: '₹7,500', payment: 'Online', status: 'cancelled', date: '21 Apr 2026' },
      { id: 'ORD-2396', customer: 'Rekha Joshi', phone: '+91 9876543215', items: 1, amount: '₹2,800', payment: 'COD', status: 'returned', date: '21 Apr 2026' },
      { id: 'ORD-2395', customer: 'Neha Gupta', phone: '+91 9876543216', items: 4, amount: '₹9,200', payment: 'Online', status: 'delivered', date: '20 Apr 2026' },
    ]
  },
  '/customers': {
    total: 2947,
    items: [
      { id: 1, name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 9876543210', orders: 12, spent: '₹45,600', status: 'active', joined: 'Jan 2025' },
      { id: 2, name: 'Anjali Verma', email: 'anjali@example.com', phone: '+91 9876543211', orders: 7, spent: '₹28,900', status: 'active', joined: 'Mar 2025' },
      { id: 3, name: 'Kavita Singh', email: 'kavita@example.com', phone: '+91 9876543212', orders: 3, spent: '₹9,200', status: 'active', joined: 'Jun 2025' },
      { id: 4, name: 'Meera Patel', email: 'meera@example.com', phone: '+91 9876543213', orders: 21, spent: '₹92,400', status: 'active', joined: 'Oct 2024' },
      { id: 5, name: 'Sunita Rao', email: 'sunita@example.com', phone: '+91 9876543214', orders: 1, spent: '₹7,500', status: 'inactive', joined: 'Apr 2026' },
    ]
  },
  '/categories': {
    items: [
      { id: 1, name: 'Saree', slug: 'saree', parent: null, products: 148, status: 'active' },
      { id: 2, name: 'Printed Saree', slug: 'printed-saree', parent: 'Saree', products: 42, status: 'active' },
      { id: 3, name: 'Plain Saree', slug: 'plain-saree', parent: 'Saree', products: 38, status: 'active' },
      { id: 4, name: 'Silk Saree', slug: 'silk-saree', parent: 'Saree', products: 68, status: 'active' },
      { id: 5, name: 'Kurtas', slug: 'kurtas', parent: null, products: 86, status: 'active' },
      { id: 6, name: 'Dupatta', slug: 'dupatta', parent: null, products: 54, status: 'active' },
      { id: 7, name: 'Stoles', slug: 'stoles', parent: null, products: 32, status: 'active' },
      { id: 8, name: 'Kolkata Silk', slug: 'kolkata-silk', parent: 'Silk Saree', products: 24, status: 'active' },
    ]
  },
  '/coupons': {
    items: [
      { id: 1, code: 'LOOM10', type: 'percentage', value: '10%', min_order: '₹500', uses: 84, max_uses: 200, expiry: '30 Jun 2026', status: 'active' },
      { id: 2, code: 'FLAT200', type: 'flat', value: '₹200', min_order: '₹1,500', uses: 45, max_uses: 100, expiry: '15 May 2026', status: 'active' },
      { id: 3, code: 'SILK20', type: 'percentage', value: '20%', min_order: '₹2,000', uses: 100, max_uses: 100, expiry: '30 Apr 2026', status: 'expired' },
      { id: 4, code: 'CASHBACK5', type: 'cashback', value: '5%', min_order: '₹1,000', uses: 28, max_uses: 500, expiry: '31 Dec 2026', status: 'active' },
    ]
  },
  '/banners': {
    items: [
      { id: 1, title: 'Summer Sale 2026', position: 'Home Hero', status: 'active', from: '01 Apr 2026', to: '30 Apr 2026' },
      { id: 2, title: 'New Arrivals - Silk Collection', position: 'Home Banner 2', status: 'active', from: '15 Apr 2026', to: '15 May 2026' },
      { id: 3, title: 'Handloom Festival', position: 'Category Top', status: 'inactive', from: '01 Mar 2026', to: '31 Mar 2026' },
    ]
  },
  '/reports': {
    monthly_revenue: [28000, 34000, 42000, 38000, 51000, 47000, 58000, 52000, 64000, 71000, 68000, 82000],
    monthly_orders: [120, 145, 162, 138, 178, 165, 190, 175, 210, 228, 215, 248],
    months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    category_sales: [
      { name: 'Saree', value: 148 },
      { name: 'Kurtas', value: 86 },
      { name: 'Dupatta', value: 54 },
      { name: 'Stoles', value: 32 },
    ]
  },
  '/transactions': {
    items: [
      { id: 'TXN-9001', order: 'ORD-2401', customer: 'Priya Sharma', amount: '₹3,450', gateway: 'Razorpay', status: 'success', date: '23 Apr 2026' },
      { id: 'TXN-9000', order: 'ORD-2400', customer: 'Anjali Verma', amount: '₹5,800', gateway: 'Razorpay', status: 'success', date: '23 Apr 2026' },
      { id: 'TXN-8999', order: 'ORD-2399', customer: 'Kavita Singh', amount: '₹1,950', gateway: 'COD', status: 'pending', date: '22 Apr 2026' },
      { id: 'TXN-8998', order: 'ORD-2397', customer: 'Sunita Rao', amount: '₹7,500', gateway: 'Razorpay', status: 'refunded', date: '21 Apr 2026' },
    ]
  }
};

// ── Sidebar ──────────────────────────────────────
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.topbar-toggle');
  const mobileOverlay = document.querySelector('.mobile-overlay');

  if (!sidebar) return;

  // Toggle on desktop
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
        mobileOverlay && mobileOverlay.classList.toggle('show');
      } else {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
      }
    });
  }

  // Restore state
  if (localStorage.getItem('sidebar-collapsed') === 'true' && window.innerWidth > 768) {
    sidebar.classList.add('collapsed');
  }

  // Mobile overlay close
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      mobileOverlay.classList.remove('show');
    });
  }

  // Submenu toggles
  document.querySelectorAll('.nav-link.has-sub').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const item = link.closest('.nav-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Active link
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(current)) {
      link.classList.add('active');
      const parentItem = link.closest('.nav-item')?.parentElement?.closest('.nav-item');
      if (parentItem) parentItem.classList.add('open');
    }
  });
}

// ── Toast Notifications ──────────────────────────
function showToast(type, title, message, duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <strong>${title}</strong>
      ${message ? `<p>${message}</p>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 260);
  }, duration);
}
function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  document.body.appendChild(c);
  return c;
}

// ── Modals ────────────────────────────────────────
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
}
function initModals() {
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  // Close buttons
  document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });
  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const open = document.querySelector('.modal-overlay.open');
      if (open) closeModal(open.id);
    }
  });
}

// ── Dropdowns ─────────────────────────────────────
function initDropdowns() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-dropdown]');
    if (trigger) {
      const dropdown = trigger.closest('.dropdown');
      const wasOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
      if (!wasOpen) dropdown.classList.add('open');
      e.stopPropagation();
      return;
    }
    document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  });
}

// ── Tabs ──────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      const container = btn.closest('[data-tabs]') || btn.parentElement.closest('[data-tabs]') || btn.closest('.card');
      if (!container) return;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = container.querySelector(`[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

// ── Confirm Delete ────────────────────────────────
function confirmDelete(msg, callback) {
  if (confirm(msg || 'Are you sure you want to delete this item? This action cannot be undone.')) {
    callback();
  }
}

// ── Format Helpers ────────────────────────────────
function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Status Badge HTML ─────────────────────────────
function statusBadge(status) {
  const map = {
    active: ['badge-success', '● Active'],
    inactive: ['badge-gray', '○ Inactive'],
    pending: ['badge-warning', '⏳ Pending'],
    processing: ['badge-info', '🔄 Processing'],
    shipped: ['badge-purple', '🚚 Shipped'],
    delivered: ['badge-success', '✓ Delivered'],
    cancelled: ['badge-danger', '✕ Cancelled'],
    returned: ['badge-gray', '↩ Returned'],
    out_of_stock: ['badge-danger', '✕ Out of Stock'],
    low_stock: ['badge-warning', '⚠ Low Stock'],
    success: ['badge-success', '✓ Success'],
    refunded: ['badge-warning', '↩ Refunded'],
    expired: ['badge-gray', '⏱ Expired'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Image Upload Preview ───────────────────────────
function initImageUpload(zoneId, previewId, multiple = false) {
  const zone = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);
  if (!zone) return;

  zone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    if (multiple) input.multiple = true;
    input.onchange = (e) => handleFiles(e.target.files);
    input.click();
  });
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault(); zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
    [...files].forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!preview) return;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.innerHTML = `
          <img src="${e.target.result}" alt="preview">
          <div class="remove-img" onclick="this.closest('.image-preview-item').remove()">✕</div>
        `;
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }
}

// ── Mini Chart (canvas-based) ─────────────────────
function drawSparkline(canvasId, data, color = '#7C3AED') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);

  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h * 0.85 - h * 0.05;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.stroke();

  // Fill
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '40'); grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad; ctx.fill();
}

// ── Bar Chart (canvas-based) ──────────────────────
function drawBarChart(canvasId, labels, data, color = '#7C3AED') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const pad = { top: 20, bottom: 40, left: 50, right: 16 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const max = Math.max(...data) * 1.15;
  const barW = chartW / labels.length * 0.6;
  const gap = chartW / labels.length;

  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#9CA3AF'; ctx.font = '11px DM Sans';
    ctx.textAlign = 'right';
    const val = Math.round(max - (max / 4) * i);
    ctx.fillText(val >= 1000 ? (val/1000).toFixed(0)+'k' : val, pad.left - 6, y + 4);
  }

  // // Bars
  // data.forEach((v, i) => {
  //   const x = pad.left + i * gap + (gap - barW) / 2;
  //   const barH = (v / max) * chartH;
  //   const y = pad.top + chartH - barH;

  //   const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH);
  //   grad.addColorStop(0, color); grad.addColorStop(1, color + '80');
  //   ctx.fillStyle = grad;
  //   ctx.beginPath();
  //   const r = 4;
  //   ctx.moveTo(x + r, y); ctx.lineTo(x + barW - r, y);
  //   ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
  //   ctx.lineTo(x + barW, y + barH); ctx.lineTo(x, y + barH);
  //   ctx.lineTo(x, y + r);
  //   ctx.quadraticCurveTo(x, y, x + r, y);
  //   ctx.fill();

  //   // Labels
  //   ctx.fillStyle = '#6B7280'; ctx.font = '11px DM Sans';
  //   ctx.textAlign = 'center';
  //   ctx.fillText(labels[i], x + barW / 2, h - pad.bottom + 16);
  // });

  const maxx = Math.max(...data, 1);

  // Bars
  data.forEach((v, i) => {
    const x = pad.left + i * gap + (gap - barW) / 2;

    const barH = (v / maxx) * chartH;
    const y = pad.top + chartH - barH;

    const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH);

    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '80');

    ctx.fillStyle = grad;

    ctx.beginPath();

    const r = 4;

    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);

    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);

    ctx.lineTo(x + barW, y + barH);
    ctx.lineTo(x, y + barH);

    ctx.lineTo(x, y + r);

    ctx.quadraticCurveTo(x, y, x + r, y);

    ctx.fill();

    // Labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px DM Sans';
    ctx.textAlign = 'center';

    ctx.fillText(labels[i], x + barW / 2, h - pad.bottom + 16);
  });
}

// ── Line Chart (canvas-based) ─────────────────────
function drawLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const pad = { top: 24, bottom: 44, left: 58, right: 20 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const allVals = datasets.flatMap(d => d.data);
  const max = Math.max(...allVals) * 1.15;
  const step = chartW / (labels.length - 1);

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#F3F4F6'; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (chartH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#9CA3AF'; ctx.font = '11px DM Sans'; ctx.textAlign = 'right';
    const val = Math.round(max - (max / 5) * i);
    ctx.fillText(val >= 1000 ? '₹'+(val/1000).toFixed(0)+'k' : val, pad.left - 6, y + 4);
  }

  // X labels
  labels.forEach((label, i) => {
    ctx.fillStyle = '#9CA3AF'; ctx.font = '11px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText(label, pad.left + i * step, h - 8);
  });

  // Datasets
  datasets.forEach(({ data, color, label }) => {
    const points = data.map((v, i) => ({
      x: pad.left + i * step,
      y: pad.top + chartH - (v / max) * chartH
    }));

    // Smooth line
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = points[i - 1];
        const cx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
      }
    });
    ctx.stroke();

    // Fill
    ctx.lineTo(points[points.length-1].x, pad.top + chartH);
    ctx.lineTo(points[0].x, pad.top + chartH); ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, color + '30'); grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad; ctx.fill();

    // Dots
    points.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    });
  });
}

// ── Donut Chart (canvas-based) ────────────────────
function drawDonutChart(canvasId, data, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const cx = w / 2; const cy = h / 2;
  const r = Math.min(w, h) / 2 - 16;
  const total = data.reduce((a, b) => a + b.value, 0);
  let angle = -Math.PI / 2;

  ctx.clearRect(0, 0, w, h);
  data.forEach((item, i) => {
    const slice = (item.value / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath(); ctx.fillStyle = colors[i]; ctx.fill();
    angle += slice;
  });

  // Donut hole
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();

  // Center text
  ctx.fillStyle = '#111827'; ctx.font = `bold 18px Sora`; ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 2);
  ctx.fillStyle = '#9CA3AF'; ctx.font = '11px DM Sans';
  ctx.fillText('Total', cx, cy + 18);
}

// ── Table Search / Filter ─────────────────────────
function initTableSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    table.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// ── Form Validation ───────────────────────────────
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return true;
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      valid = false;
    } else {
      field.classList.remove('is-invalid');
    }
  });
  return valid;
}

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initModals();
  initDropdowns();
  initTabs();
});

// Expose globals
window.API = API;
window.MockData = MockData;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;
window.formatCurrency = formatCurrency;
window.statusBadge = statusBadge;
window.initImageUpload = initImageUpload;
window.drawBarChart = drawBarChart;
window.drawLineChart = drawLineChart;
window.drawDonutChart = drawDonutChart;
window.drawSparkline = drawSparkline;
window.initTableSearch = initTableSearch;
window.validateForm = validateForm;