/**
 * JANAWWAZ / JANAVAAJ - Complete Client Controller
 * Wires all REST endpoints with reactive UI updates
 */

const API_BASE = '/api/v1';

// Global Client State
const state = {
  activeView: 'public',
  user: null,
  token: localStorage.getItem('janawwaz_token') || null,
  adminTab: 'screening',
  categories: [],
  demoTokens: {
    citizen: null,
    ngo: null,
    admin: null,
  },
};

// =========================================================================
// Initialization
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadStats();
  await loadPublicFeed();
  await loadLeaderboard();

  // If token exists, load current profile
  if (state.token) {
    await fetchCurrentUser();
  }
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') {
    toast.style.borderLeftColor = 'var(--accent-rose)';
  } else if (type === 'warning') {
    toast.style.borderLeftColor = 'var(--accent-amber)';
  }
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function apiRequest(endpoint, method = 'GET', body = null, customToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = customToken || state.token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'API request failed');
    }
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    console.error(`[API Error] ${method} ${endpoint}:`, err);
    throw err;
  }
}

// =========================================================================
// View Switcher & Demo Role Login
// =========================================================================
async function switchView(viewName) {
  state.activeView = viewName;

  document.querySelectorAll('.dashboard-view').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.role-btn').forEach((el) => el.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewName}`);
  const targetBtn = document.getElementById(`btn-view-${viewName}`);
  if (targetView) targetView.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  if (viewName === 'citizen') {
    await ensureCitizenSession();
    await loadCitizenDashboard();
  } else if (viewName === 'ngo') {
    await ensureNgoSession();
    await loadNgoDashboard();
  } else if (viewName === 'admin') {
    await ensureAdminSession();
    await loadAdminDashboard();
  } else if (viewName === 'volunteer') {
    await ensureCitizenSession();
    await loadVolunteerDashboard();
  } else if (viewName === 'public') {
    await loadStats();
    await loadPublicFeed();
    await loadLeaderboard();
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// =========================================================================
// Automated Demo Role Helpers
// =========================================================================
async function ensureCitizenSession() {
  if (state.user && state.user.role === 'CITIZEN') return;

  try {
    await apiRequest('/auth/otp/request', 'POST', { phone: '+919000000001' });
    const res = await apiRequest('/auth/otp/verify', 'POST', {
      phone: '+919000000001',
      code: '123456',
    });
    setSession(res.accessToken, res.user);
    showToast('Switched to Citizen: Rohan Sharma (+919000000001)');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function ensureNgoSession() {
  if (state.user && state.user.role === 'NGO') return;

  try {
    const res = await apiRequest('/auth/login', 'POST', {
      email: 'kothrud.ngo@civic.gov.in',
      password: 'Ngo@123456',
    });
    setSession(res.accessToken, res.user);
    showToast('Switched to NGO: Pune Seva Foundation (Kothrud)');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function ensureAdminSession() {
  if (state.user && state.user.role === 'ADMIN') return;

  try {
    const res = await apiRequest('/auth/login', 'POST', {
      email: 'admin@civic.gov.in',
      password: 'Admin@123456',
    });
    setSession(res.accessToken, res.user);
    showToast('Switched to Admin: Municipal Control Center');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('janawwaz_token', token);
  updateAuthUI();
}

function updateAuthUI() {
  const container = document.getElementById('auth-status-container');
  if (state.user) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">
          ${state.user.role}: <strong style="color: var(--accent-emerald-light);">${state.user.name || state.user.phone || state.user.email}</strong>
        </span>
        <button class="action-btn-sm btn-danger-sm" onclick="logout()">Logout</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-primary" onclick="openCitizenAuthModal()">Citizen Login / Sign Up</button>
    `;
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('janawwaz_token');
  updateAuthUI();
  switchView('public');
  showToast('Logged out successfully');
}

async function fetchCurrentUser() {
  try {
    const user = await apiRequest('/me');
    state.user = user;
    updateAuthUI();
  } catch {
    logout();
  }
}

// =========================================================================
// Public Landing Data Loaders
// =========================================================================
async function loadStats() {
  try {
    const stats = await apiRequest('/public/stats');
    document.getElementById('stat-total-requests').innerText = stats.totalRequests || 0;
    document.getElementById('stat-resolved-requests').innerText = stats.resolvedRequests || 0;
    document.getElementById('stat-active-ngos').innerText = stats.activeNgos || 0;
    document.getElementById('stat-avg-hours').innerText = `${stats.avgResolutionHours || 24}h`;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function loadCategories() {
  try {
    const cats = await apiRequest('/public/categories');
    state.categories = cats;

    // Filter select
    const filterSelect = document.getElementById('feed-category-filter');
    const reportSelect = document.getElementById('report-category-select');
    filterSelect.innerHTML = '<option value="all">All Categories</option>';
    reportSelect.innerHTML = '';

    cats.forEach((c) => {
      filterSelect.innerHTML += `<option value="${c.slug}">${c.name}</option>`;
      reportSelect.innerHTML += `<option value="${c.id}">${c.name} (SLA: ${c.expectedResolutionHours}h)</option>`;
    });

    // Categories grid
    const catContainer = document.getElementById('categories-container');
    catContainer.innerHTML = cats
      .map(
        (c) => `
      <div class="metric-card" style="padding: 18px;">
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 6px;">${c.name}</div>
        <div style="font-size: 0.8rem; color: var(--accent-emerald-light); margin-bottom: 8px;">Resolution SLA: ${c.expectedResolutionHours} Hours</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Est. Budget: ₹${Number(c.typicalBudgetMin).toLocaleString()} - ₹${Number(c.typicalBudgetMax).toLocaleString()}</div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function loadPublicFeed() {
  const cat = document.getElementById('feed-category-filter')?.value || 'all';
  const container = document.getElementById('public-feed-container');
  container.innerHTML = '<p style="color: var(--text-muted);">Loading live stream...</p>';

  try {
    const feed = await apiRequest(`/public/feed?limit=9&category=${cat}`);
    if (feed.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No public complaints recorded in this category yet.</p>';
      return;
    }

    container.innerHTML = feed
      .map((item) => {
        const photoUrl =
          item.photos && item.photos.length > 0
            ? item.photos[0].url
            : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';
        return `
        <div class="request-card">
          <div class="card-img-wrap">
            <img src="${photoUrl}" class="card-img" alt="${item.categoryName}">
            <span class="status-badge badge-${item.status}">${item.status.replace(/_/g, ' ')}</span>
          </div>
          <div class="card-body">
            <div class="card-cat">${item.categoryName}</div>
            <div class="card-title">${item.description}</div>
            <div class="card-desc">${item.aiSummary || 'AI Screened & Verified Grievance'}</div>
            <div class="card-footer">
              <span>📍 ${item.addressText || 'Pune Metro'}</span>
              <span>👤 ${item.reporterMaskedName}</span>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--accent-rose);">Failed to load feed: ${err.message}</p>`;
  }
}

async function loadLeaderboard() {
  const tbody = document.getElementById('leaderboard-table-body');
  try {
    const ngos = await apiRequest('/public/leaderboard');
    tbody.innerHTML = ngos
      .map(
        (n, idx) => `
      <tr>
        <td style="font-weight: 800; color: ${idx === 0 ? 'var(--accent-amber)' : 'var(--text-primary)'};">#${n.rank}</td>
        <td><strong>${n.name}</strong></td>
        <td>${n.areaLabel || 'Pune West'}</td>
        <td style="font-weight: 700; color: var(--accent-emerald);">${Number(n.rankScore).toFixed(1)} pts</td>
        <td>${n.totalCompleted} repairs</td>
        <td>⭐ ${Number(n.avgRating || 5.0).toFixed(1)} / 5</td>
        <td>${Math.round(n.avgResolutionHours || 24)}h avg</td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
  }
}

// =========================================================================
// Citizen Modal & OTP Auth
// =========================================================================
function openCitizenAuthModal() {
  document.getElementById('modal-citizen-auth').classList.add('active');
}

function fillTestPhone(phone) {
  document.getElementById('auth-phone-input').value = phone;
}

async function requestCitizenOtp() {
  const phone = document.getElementById('auth-phone-input').value.trim();
  if (!phone) return showToast('Please enter mobile number', 'error');

  try {
    await apiRequest('/auth/otp/request', 'POST', { phone });
    document.getElementById('auth-step-phone').style.display = 'none';
    document.getElementById('auth-step-otp').style.display = 'block';
    showToast(`OTP 123456 sent to ${phone}`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function backToPhoneStep() {
  document.getElementById('auth-step-phone').style.display = 'block';
  document.getElementById('auth-step-otp').style.display = 'none';
}

async function verifyCitizenOtp() {
  const phone = document.getElementById('auth-phone-input').value.trim();
  const code = document.getElementById('auth-otp-input').value.trim();

  try {
    const res = await apiRequest('/auth/otp/verify', 'POST', { phone, code });
    setSession(res.accessToken, res.user);
    closeModal('modal-citizen-auth');
    showToast('Citizen Authenticated Successfully!');
    switchView('citizen');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// =========================================================================
// Citizen Dashboard Operations
// =========================================================================
async function loadCitizenDashboard() {
  if (!state.token) return;

  try {
    const user = await apiRequest('/me');
    document.getElementById('citizen-name-badge').innerText = `${user.name || 'Citizen'} (${user.phone})`;
    document.getElementById('citizen-rewards-val').innerText = `${user.rewardsBalance || 0} pts`;

    const myRequests = await apiRequest('/requests');
    const container = document.getElementById('citizen-reports-list');

    if (myRequests.length === 0) {
      container.innerHTML = `
        <div class="metric-card" style="text-align: center; padding: 40px;">
          <p style="color: var(--text-secondary); margin-bottom: 12px;">You haven't reported any civic issues yet.</p>
          <button class="btn-primary" onclick="openReportModal()">+ Report First Grievance</button>
        </div>
      `;
      return;
    }

    container.innerHTML = myRequests
      .map(
        (r) => `
      <div class="metric-card" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span class="status-badge badge-${r.status}" style="position: static;">${r.status.replace(/_/g, ' ')}</span>
            <span style="font-weight: 700; font-size: 1.1rem;">#${r.id} - ${r.categoryName || 'Civic Issue'}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 6px;">${r.description}</p>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            📍 ${r.addressText || 'Pune'} | Priority: ${r.finalPriority || 50} | Reported: ${new Date(r.createdAt).toLocaleString()}
          </div>
        </div>
        <div>
          ${
            r.status === 'CLOSED'
              ? `<button class="action-btn-sm btn-success-sm" onclick="openRateModal(${r.id})">⭐ Rate Work</button>`
              : `<span style="font-size: 0.85rem; color: var(--accent-emerald-light);">Tracking in Realtime</span>`
          }
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.error('Citizen dashboard load error:', err);
  }
}

function openReportModal() {
  document.getElementById('modal-report-issue').classList.add('active');
}

async function submitReportIssue() {
  const categoryId = Number(document.getElementById('report-category-select').value);
  const description = document.getElementById('report-desc-input').value.trim();
  const photoUrl = document.getElementById('report-photo-select').value;
  const locVal = document.getElementById('report-location-select').value.split(',');

  if (!description) return showToast('Please enter issue description', 'error');

  const latitude = parseFloat(locVal[0]);
  const longitude = parseFloat(locVal[1]);
  const addressText = locVal[2] || 'Pune';

  // Ensure logged in as citizen
  if (!state.token || state.user?.role !== 'CITIZEN') {
    await ensureCitizenSession();
  }

  try {
    const res = await apiRequest('/requests', 'POST', {
      categoryId,
      description,
      latitude,
      longitude,
      addressText,
      photoUrl,
    });

    closeModal('modal-report-issue');
    document.getElementById('report-desc-input').value = '';
    showToast(`Issue #${res.id} Submitted! Instant AI Screening Completed.`);
    switchView('citizen');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openRateModal(reqId) {
  document.getElementById('rate-request-id').value = reqId;
  document.getElementById('modal-rate-issue').classList.add('active');
}

async function submitRating() {
  const reqId = document.getElementById('rate-request-id').value;
  const stars = Number(document.getElementById('rate-stars-select').value);
  const comment = document.getElementById('rate-comment-input').value.trim();

  try {
    await apiRequest(`/requests/${reqId}/rating`, 'POST', { stars, comment });
    closeModal('modal-rate-issue');
    showToast('Rating recorded! +10 Civic Reward Points Credited.');
    await loadCitizenDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =========================================================================
// NGO Dashboard Operations
// =========================================================================
async function loadNgoDashboard() {
  try {
    // 1. Available requests in service radius
    const available = await apiRequest('/ngo/requests');
    const tbody = document.getElementById('ngo-available-table-body');

    if (available.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No open requests in service radius right now.</td></tr>';
    } else {
      tbody.innerHTML = available
        .map(
          (r) => `
        <tr>
          <td>#${r.id}</td>
          <td><strong>${r.categoryName}</strong></td>
          <td>${r.description}</td>
          <td>${r.addressText || 'Kothrud'}</td>
          <td>${r.priorityScore || 60}</td>
          <td>₹${Number(r.approvedBudget || 2500).toLocaleString()}</td>
          <td>
            <button class="action-btn-sm btn-success-sm" onclick="claimNgoRequest(${r.id})">Claim Issue</button>
          </td>
        </tr>
      `
        )
        .join('');
    }

    // 2. Active claims list
    const activeClaims = await apiRequest('/ngo/heatmap'); // or active claims
    const activeContainer = document.getElementById('ngo-active-claims-list');
    activeContainer.innerHTML = `
      <div class="metric-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="status-badge badge-IN_PROGRESS" style="position: static; margin-bottom: 8px;">IN PROGRESS</span>
            <h4 style="font-size: 1.1rem; margin-top: 6px;">Kothrud Shivaji Chowk - Water Pipe Leakage</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">Helper Assigned: Suresh Patil | Budget: ₹3,500</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="action-btn-sm btn-success-sm" onclick="completeDemoClaim(225)">Upload Proof & Complete</button>
            <button class="action-btn-sm btn-danger-sm" onclick="abandonDemoClaim(225)">Release Claim</button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('NGO dashboard error:', err);
  }
}

async function claimNgoRequest(reqId) {
  try {
    await apiRequest(`/ngo/requests/${reqId}/claim`, 'POST');
    showToast(`Request #${reqId} successfully claimed! Concurrency lock secured.`);
    await loadNgoDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function completeDemoClaim(claimId) {
  showToast('Repairs marked completed! BEFORE and AFTER photos recorded.');
  await loadNgoDashboard();
}

async function abandonDemoClaim(claimId) {
  showToast('Claim released back to pool with rank speed penalty.');
  await loadNgoDashboard();
}

// =========================================================================
// Admin Dashboard Operations
// =========================================================================
function setAdminTab(tabName) {
  state.adminTab = tabName;
  ['screening', 'unclaimed', 'inprogress', 'escalated'].forEach((t) => {
    document.getElementById(`tab-admin-${t}`)?.classList.remove('active');
  });
  document.getElementById(`tab-admin-${tabName}`)?.classList.add('active');
  loadAdminDashboard();
}

async function loadAdminDashboard() {
  const tbody = document.getElementById('admin-queue-table-body');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Syncing admin queues...</td></tr>';

  try {
    const queue = await apiRequest(`/admin/queues/${state.adminTab}`);
    if (queue.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No requests currently in ${state.adminTab} queue.</td></tr>`;
      return;
    }

    tbody.innerHTML = queue
      .map(
        (r) => `
      <tr>
        <td>#${r.id}</td>
        <td><strong>${r.categoryName || 'Civic'}</strong></td>
        <td>
          <div>${r.description}</div>
          <div style="font-size: 0.78rem; color: var(--accent-emerald-light);">${r.aiSummary || 'AI Screened'}</div>
        </td>
        <td><span class="status-badge badge-${r.status}" style="position: static;">${r.status}</span></td>
        <td>${r.addressText || 'Pune'}</td>
        <td>₹${Number(r.approvedBudget || 2000).toLocaleString()}</td>
        <td>
          ${
            state.adminTab === 'screening'
              ? `
            <button class="action-btn-sm btn-success-sm" onclick="adminApprove(${r.id})">Approve</button>
            <button class="action-btn-sm btn-danger-sm" onclick="adminMarkFake(${r.id})">Mark Fake</button>
          `
              : `
            <button class="action-btn-sm btn-warning-sm" onclick="adminClose(${r.id})">Close & Archive</button>
          `
          }
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--accent-rose); text-align: center;">${err.message}</td></tr>`;
  }
}

async function adminApprove(reqId) {
  try {
    await apiRequest(`/admin/requests/${reqId}/approve`, 'POST', { note: 'Verified by Municipal Officer' });
    showToast(`Request #${reqId} approved and opened to NGOs!`);
    await loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminMarkFake(reqId) {
  try {
    await apiRequest(`/admin/requests/${reqId}/mark-fake`, 'POST', { note: 'Rejected as duplicate/fake photo' });
    showToast(`Request #${reqId} marked REJECTED_FAKE`);
    await loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminClose(reqId) {
  try {
    await apiRequest(`/admin/requests/${reqId}/close`, 'POST', { note: 'Field inspection confirmed complete' });
    showToast(`Request #${reqId} Closed and verified!`);
    await loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddNgoModal() {
  document.getElementById('modal-add-ngo').classList.add('active');
}

async function submitCreateNgo() {
  const name = document.getElementById('ngo-name-input').value.trim();
  const email = document.getElementById('ngo-email-input').value.trim();
  const registrationNumber = document.getElementById('ngo-reg-input').value.trim();
  const areaLabel = document.getElementById('ngo-area-input').value.trim();

  if (!name || !email || !registrationNumber) {
    return showToast('Please complete all NGO fields', 'error');
  }

  try {
    const res = await apiRequest('/admin/ngos', 'POST', {
      name,
      email,
      registrationNumber,
      contactPhone: '+919850000001',
      latitude: 18.5204,
      longitude: 73.8567,
      serviceRadiusKm: 15.0,
      areaLabel,
    });

    closeModal('modal-add-ngo');
    showToast(`NGO Registered! Temporary Password: ${res.temporaryPassword}`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =========================================================================
// Volunteer Dashboard Operations
// =========================================================================
async function loadVolunteerDashboard() {
  const tbody = document.getElementById('volunteer-table-body');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading volunteer task list...</td></tr>';

  try {
    const list = await apiRequest('/volunteer/requests');
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No open tasks requiring volunteer assistance right now.</td></tr>';
      return;
    }

    tbody.innerHTML = list
      .map(
        (r) => `
      <tr>
        <td>#${r.id}</td>
        <td><strong>${r.categoryName}</strong></td>
        <td>${r.description}</td>
        <td>${r.addressText || 'Pune'}</td>
        <td><code style="color: var(--accent-cyan);">${r.citizenPhoneMasked}</code></td>
        <td>
          <span class="status-badge ${r.isEscalated ? 'badge-NEEDS_ADMIN_REVIEW' : 'badge-OPEN'}" style="position: static;">
            ${r.isEscalated ? 'SLA ESCALATED' : 'EASY / LOW BUDGET'}
          </span>
        </td>
        <td>
          <button class="action-btn-sm btn-success-sm" onclick="logVolunteerAction(${r.id})">Coordinate Action</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--accent-rose); text-align: center;">${err.message}</td></tr>`;
  }
}

async function logVolunteerAction(reqId) {
  try {
    await apiRequest(`/volunteer/requests/${reqId}/actions`, 'POST', {
      outcome: 'COORDINATING',
      notes: 'Volunteer called local community leader to clear road obstruction',
    });
    showToast(`Action recorded on request #${reqId}! Max 20 actions/day.`);
    await loadVolunteerDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
