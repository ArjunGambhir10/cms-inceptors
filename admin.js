/* ═══════════════════════════════════════════════════════════════
   CMS INCEPTORS — admin.js
   Password-protected dashboard for viewing & managing entries
   stored in localStorage by the main site's app.js.
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── Config ───────────────────────────────────────────────────── */
const ADMIN_PASSWORD = 'cmsinceptors2025';   // change this to your password
const STORAGE_KEY    = 'cms_applications';
const SESSION_KEY    = 'cms_admin_auth';

/* ── DOM refs ─────────────────────────────────────────────────── */
const loginScreen  = document.getElementById('login-screen');
const dashboard    = document.getElementById('dashboard');
const loginForm    = document.getElementById('login-form');
const pwdInput     = document.getElementById('admin-password');
const loginError   = document.getElementById('login-error');

const entriesList  = document.getElementById('entries-list');
const emptyState   = document.getElementById('empty-state');
const emptyTitle   = document.getElementById('empty-title');
const emptySub     = document.getElementById('empty-sub');
const resultsMeta  = document.getElementById('results-meta');

const searchInput  = document.getElementById('search-input');
const filterClass  = document.getElementById('filter-class');
const filterSection= document.getElementById('filter-section');
const filterSort   = document.getElementById('filter-sort');

const btnExport    = document.getElementById('btn-export');
const btnLogout    = document.getElementById('btn-logout');
const btnClearAll  = document.getElementById('btn-clear-all');

// Stats
const numTotal  = document.getElementById('num-total');
const num9      = document.getElementById('num-9');
const num11     = document.getElementById('num-11');
const numDrive  = document.getElementById('num-drive');
const numFiles  = document.getElementById('num-files');

// Modal
const modalOverlay  = document.getElementById('modal-overlay');
const modalClose    = document.getElementById('modal-close');
const modalAvatar   = document.getElementById('modal-avatar');
const modalName     = document.getElementById('modal-name');
const modalMeta     = document.getElementById('modal-meta');
const modalSkills   = document.getElementById('modal-skills');
const modalMotiv    = document.getElementById('modal-motivation');
const modalDriveSec = document.getElementById('modal-drive-section');
const modalDrive    = document.getElementById('modal-drive');
const modalFilesSec = document.getElementById('modal-files-section');
const modalFiles    = document.getElementById('modal-files');
const modalTime     = document.getElementById('modal-timestamp');
const modalDelete   = document.getElementById('modal-delete');

/* ── State ────────────────────────────────────────────────────── */
let allEntries    = [];   // raw data from localStorage
let activeEntryId = null; // id of entry currently shown in modal

/* ═══════════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════════ */
function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function login() {
  sessionStorage.setItem(SESSION_KEY, 'true');
  loginScreen.hidden = true;
  dashboard.hidden   = false;
  loadAndRender();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  dashboard.hidden   = true;
  loginScreen.hidden = false;
  pwdInput.value     = '';
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const val = pwdInput.value.trim();
  if (val === ADMIN_PASSWORD) {
    loginError.hidden = true;
    login();
  } else {
    loginError.hidden = false;
    pwdInput.classList.add('shake');
    pwdInput.addEventListener('animationend', () => pwdInput.classList.remove('shake'), { once: true });
    pwdInput.focus();
  }
});

btnLogout.addEventListener('click', logout);

// Auto-login if session still valid
if (isAuthenticated()) {
  loginScreen.hidden = true;
  dashboard.hidden   = false;
}

/* ═══════════════════════════════════════════════════════════════
   DATA HELPERS
═══════════════════════════════════════════════════════════════ */
function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function deleteEntry(id) {
  allEntries = allEntries.filter(e => e.id !== id);
  saveEntries(allEntries);
}

function deleteAll() {
  allEntries = [];
  saveEntries(allEntries);
}

/* ── Unique ID for each entry (added when saving from app.js) ── */
function ensureIds(entries) {
  let changed = false;
  entries.forEach(e => {
    if (!e.id) { e.id = crypto.randomUUID(); changed = true; }
  });
  if (changed) saveEntries(entries);
  return entries;
}

/* ═══════════════════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════════════════ */
function updateStats(entries) {
  numTotal.textContent = entries.length;
  num9.textContent     = entries.filter(e => String(e.class) === '9').length;
  num11.textContent    = entries.filter(e => String(e.class) === '11').length;
  numDrive.textContent = entries.filter(e => e.drive_link && e.drive_link.trim()).length;
  numFiles.textContent = entries.filter(e => e.files && e.files.trim()).length;
}

/* ═══════════════════════════════════════════════════════════════
   FILTER + SORT + SEARCH
═══════════════════════════════════════════════════════════════ */
function getFiltered() {
  const q       = searchInput.value.trim().toLowerCase();
  const cls     = filterClass.value;
  const section = filterSection.value;
  const sort    = filterSort.value;

  let result = allEntries.filter(e => {
    if (cls     && String(e.class)   !== cls)     return false;
    if (section && e.section         !== section) return false;
    if (q) {
      const hay = [e.name, e.skills, e.motivation, e.section].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  result.sort((a, b) => {
    if (sort === 'oldest') return (a._savedAt || 0) - (b._savedAt || 0);
    if (sort === 'name')   return (a.name || '').localeCompare(b.name || '');
    // newest (default)
    return (b._savedAt || 0) - (a._savedAt || 0);
  });

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   HIGHLIGHT SEARCH TERM
═══════════════════════════════════════════════════════════════ */
function highlight(text, query) {
  if (!query || !text) return escHtml(text || '');
  const escaped = escHtml(text);
  const re = new RegExp(`(${escRe(query)})`, 'gi');
  return escaped.replace(re, '<mark>$1</mark>');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ═══════════════════════════════════════════════════════════════
   AVATAR INITIALS + COLOR
═══════════════════════════════════════════════════════════════ */
const AVATAR_COLORS = ['#f7d44c','#ff4e1a','#2dbe6c','#1a6fff','#ff6b9d','#a78bfa'];

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  for (const c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ═══════════════════════════════════════════════════════════════
   RENDER ENTRIES
═══════════════════════════════════════════════════════════════ */
function render() {
  const filtered = getFiltered();
  const q        = searchInput.value.trim().toLowerCase();

  entriesList.innerHTML = '';

  // Update result count
  resultsMeta.textContent = filtered.length
    ? `Showing ${filtered.length} of ${allEntries.length} application${allEntries.length !== 1 ? 's' : ''}`
    : '';

  if (filtered.length === 0) {
    emptyState.hidden = false;
    if (allEntries.length === 0) {
      emptyTitle.textContent = 'No applications yet';
      emptySub.textContent   = 'Once students submit the form, their entries will appear here.';
    } else {
      emptyTitle.textContent = 'No results found';
      emptySub.textContent   = 'Try adjusting your search or filters.';
    }
    return;
  }

  emptyState.hidden = true;

  filtered.forEach(entry => {
    const card = document.createElement('article');
    card.className = 'entry-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View application from ${entry.name}`);

    const initials = getInitials(entry.name);
    const color    = getAvatarColor(entry.name);
    const hasDrive = entry.drive_link && entry.drive_link.trim();
    const hasFiles = entry.files && entry.files.trim();

    const tagsHtml = `
      <span class="entry-tag entry-tag--class">Class ${escHtml(String(entry.class))}</span>
      <span class="entry-tag entry-tag--section">Section ${escHtml(entry.section || '')}</span>
      ${hasDrive ? '<span class="entry-tag entry-tag--drive">Drive ↗</span>' : ''}
      ${hasFiles ? '<span class="entry-tag entry-tag--files">Files</span>'  : ''}
    `;

    card.innerHTML = `
      <div class="entry-avatar" style="background:${color}">${initials}</div>
      <div class="entry-info">
        <div class="entry-name">${highlight(entry.name, q)}</div>
        <div class="entry-tags">${tagsHtml}</div>
        <div class="entry-skills-preview">${highlight(entry.skills || '', q)}</div>
      </div>
      <div class="entry-meta">
        <span class="entry-time">${formatTime(entry._savedAt)}</span>
        <svg class="entry-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `;

    card.addEventListener('click',  () => openModal(entry.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(entry.id); } });

    entriesList.appendChild(card);
  });
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

/* ═══════════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════════ */
function openModal(id) {
  const entry = allEntries.find(e => e.id === id);
  if (!entry) return;
  activeEntryId = id;

  const initials = getInitials(entry.name);
  const color    = getAvatarColor(entry.name);

  modalAvatar.textContent      = initials;
  modalAvatar.style.background = color;
  modalName.textContent        = entry.name || '—';
  modalMeta.textContent        = `Class ${entry.class || '?'}  ·  Section ${entry.section || '?'}`;
  modalSkills.textContent      = entry.skills || '—';
  modalMotiv.textContent       = entry.motivation || '—';
  modalTime.textContent        = entry.timestamp || formatTime(entry._savedAt) || '—';

  if (entry.drive_link && entry.drive_link.trim()) {
    modalDriveSec.hidden    = false;
    modalDrive.href         = entry.drive_link.trim();
    modalDrive.textContent  = entry.drive_link.trim();
  } else {
    modalDriveSec.hidden = true;
  }

  if (entry.files && entry.files.trim()) {
    modalFilesSec.hidden   = false;
    modalFiles.textContent = entry.files.trim().split(',').map(f => f.trim()).filter(Boolean).join('\n');
  } else {
    modalFilesSec.hidden = true;
  }

  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = '';
  activeEntryId = null;
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modalOverlay.hidden) closeModal(); });

modalDelete.addEventListener('click', () => {
  if (!activeEntryId) return;
  const entry = allEntries.find(e => e.id === activeEntryId);
  if (!confirm(`Delete application from ${entry?.name || 'this student'}? This cannot be undone.`)) return;
  deleteEntry(activeEntryId);
  closeModal();
  loadAndRender();
});

/* ═══════════════════════════════════════════════════════════════
   EXPORT CSV
═══════════════════════════════════════════════════════════════ */
function exportCSV() {
  if (allEntries.length === 0) { alert('No entries to export.'); return; }

  const headers = ['Timestamp','Name','Class','Section','Skills','Drive Link','Motivation','Files'];
  const rows = allEntries.map(e => [
    e.timestamp || '',
    e.name      || '',
    e.class     || '',
    e.section   || '',
    e.skills    || '',
    e.drive_link|| '',
    e.motivation|| '',
    e.files     || '',
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));

  const csv  = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cms-inceptors-applications-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

btnExport.addEventListener('click', exportCSV);

/* ═══════════════════════════════════════════════════════════════
   CLEAR ALL
═══════════════════════════════════════════════════════════════ */
btnClearAll.addEventListener('click', () => {
  if (allEntries.length === 0) { alert('There are no entries to delete.'); return; }
  if (!confirm(`Delete all ${allEntries.length} application(s)? This cannot be undone.`)) return;
  deleteAll();
  loadAndRender();
});

/* ═══════════════════════════════════════════════════════════════
   LIVE FILTERS
═══════════════════════════════════════════════════════════════ */
searchInput.addEventListener('input',   render);
filterClass.addEventListener('change',  render);
filterSection.addEventListener('change',render);
filterSort.addEventListener('change',   render);

/* ═══════════════════════════════════════════════════════════════
   LOAD + RENDER
═══════════════════════════════════════════════════════════════ */
function loadAndRender() {
  allEntries = ensureIds(loadEntries());
  updateStats(allEntries);
  render();
}

// Init on page load if already authenticated
if (isAuthenticated()) {
  loadAndRender();
}

// Poll for new entries every 10 seconds (in case form is open in another tab)
setInterval(() => {
  if (isAuthenticated()) {
    const fresh = ensureIds(loadEntries());
    // Only re-render if data actually changed
    if (JSON.stringify(fresh) !== JSON.stringify(allEntries)) {
      allEntries = fresh;
      updateStats(allEntries);
      render();
    }
  }
}, 10000);
