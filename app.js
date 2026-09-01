/* =========================================================
   SERYU TC MONITORING V2
   GITHUB FRONTEND
========================================================= */

const API_URL =
  'https://script.google.com/macros/s/AKfycbxUgKEUjjGPMAIXAIT3L03pWvOlW_OdpeaNJ_KJqlFV5BBJOAelogJl4kZju7flsLgS/exec';


const state = {
  token: localStorage.getItem('seryutc_token') || '',
  user: JSON.parse(
    localStorage.getItem('seryutc_user') || 'null'
  ),
  currentTrip: null,
  kendala: []
};


/* =========================================================
   API
========================================================= */

async function apiGet(action, params = {}) {

  const query = new URLSearchParams({
    action,
    token: state.token,
    ...params
  });

  const response =
    await fetch(`${API_URL}?${query.toString()}`);

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Response API tidak valid');
  }
}


async function apiPost(action, data = {}) {

  const response =
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action,
        token: state.token,
        ...data
      })
    });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Response API tidak valid');
  }
}


/* =========================================================
   INIT
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  bindEvents();

  updateClock();

  setInterval(updateClock, 1000);

  if (state.token && state.user) {
    showApp();
  } else {
    showLogin();
  }

});


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

  document
    .getElementById('loginForm')
    .addEventListener('submit', login);


  document
    .getElementById('logoutBtn')
    .addEventListener('click', logout);


  document
    .getElementById('refreshBtn')
    .addEventListener('click', refreshCurrentPage);


  document
    .getElementById('searchBtn')
    .addEventListener('click', searchAWB);


  document
    .getElementById('loadMonitorBtn')
    .addEventListener('click', loadMonitoringAWB);


  document
    .getElementById('saveMonitorBtn')
    .addEventListener('click', saveMonitoring);


  document
    .getElementById('saveKendalaBtn')
    .addEventListener('click', saveKendala);


  document
    .getElementById('liveFilterBtn')
    .addEventListener('click', loadLiveTrips);


  document
    .getElementById('monitorPhoto')
    .addEventListener('change', previewPhoto);


  document
    .getElementById('awbSearch')
    .addEventListener('keydown', e => {

      if (e.key === 'Enter') {
        searchAWB();
      }

    });


  document
    .getElementById('monitorAWB')
    .addEventListener('keydown', e => {

      if (e.key === 'Enter') {
        loadMonitoringAWB();
      }

    });


  document
    .querySelectorAll('.nav-item')
    .forEach(button => {

      button.addEventListener('click', () => {

        switchPage(
          button.dataset.page
        );

      });

    });

}


/* =========================================================
   LOGIN
========================================================= */

async function login(e) {

  e.preventDefault();

  const username =
    document.getElementById('username').value.trim();

  const password =
    document.getElementById('password').value.trim();

  const errorBox =
    document.getElementById('loginError');

  const loginText =
    document.getElementById('loginText');

  errorBox.classList.add('hidden');

  loginText.textContent = 'Checking...';

  try {

    const result =
      await apiPost('login', {
        username,
        password
      });

    if (!result.success) {
      throw new Error(
        result.error || 'Login gagal'
      );
    }

    state.token = result.token;
    state.user = result.user;

    localStorage.setItem(
      'seryutc_token',
      state.token
    );

    localStorage.setItem(
      'seryutc_user',
      JSON.stringify(state.user)
    );

    showApp();

  } catch (err) {

    errorBox.textContent =
      err.message;

    errorBox.classList.remove('hidden');

  } finally {

    loginText.textContent = 'Login';

  }

}


/* =========================================================
   SHOW LOGIN / APP
========================================================= */

function showLogin() {

  document
    .getElementById('loginPage')
    .classList.remove('hidden');

  document
    .getElementById('app')
    .classList.add('hidden');

}


function showApp() {

  document
    .getElementById('loginPage')
    .classList.add('hidden');

  document
    .getElementById('app')
    .classList.remove('hidden');

  setUser();

  loadDashboard();

  loadKendala();

  loadProjects();

}


function setUser() {

  const user =
    state.user || {};

  const name =
    user.nama ||
    user.username ||
    'User';

  const role =
    user.role ||
    'TC';

  document
    .getElementById('userName')
    .textContent = name;

  document
    .getElementById('userRole')
    .textContent = role;

  document
    .getElementById('userAvatar')
    .textContent =
      name
        .substring(0, 2)
        .toUpperCase();

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  localStorage.removeItem('seryutc_token');
  localStorage.removeItem('seryutc_user');

  state.token = '';
  state.user = null;

  showLogin();

}


/* =========================================================
   PAGE
========================================================= */

function switchPage(page) {

  document
    .querySelectorAll('.page')
    .forEach(el => {
      el.classList.remove('active');
    });

  document
    .querySelectorAll('.nav-item')
    .forEach(el => {
      el.classList.remove('active');
    });

  const target =
    document.getElementById(
      `page-${page}`
    );

  const nav =
    document.querySelector(
      `[data-page="${page}"]`
    );

  if (target) {
    target.classList.add('active');
  }

  if (nav) {
    nav.classList.add('active');
  }

  const titles = {
    dashboard: [
      'Dashboard',
      'Logistics Control Tower'
    ],
    live: [
      'Live Trip',
      'Monitoring perjalanan aktif'
    ],
    search: [
      'Search AWB',
      'Detail trip dan tracking'
    ],
    monitoring: [
      'Update Monitoring',
      'Update perjalanan'
    ],
    kendala: [
      'Kendala',
      'Master kendala monitoring'
    ],
    report: [
      'Report',
      'Summary monitoring'
    ]
  };

  const title =
    titles[page] || ['Dashboard', ''];

  document
    .getElementById('pageTitle')
    .textContent = title[0];

  document
    .getElementById('pageSubtitle')
    .textContent = title[1];


  if (page === 'dashboard') {
    loadDashboard();
  }

  if (page === 'live') {
    loadLiveTrips();
  }

  if (page === 'kendala') {
    loadKendala();
  }

  if (page === 'report') {
    loadReport();
  }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

  try {

    const result =
      await apiGet('dashboard');

    if (!result.success) {
      throw new Error(result.error);
    }

    const s =
      result.stats || {};

    document
      .getElementById('statTotal')
      .textContent =
        s.totalTrip || 0;

    document
      .getElementById('statOnTrip')
      .textContent =
        s.onTrip || 0;

    document
      .getElementById('statDelivered')
      .textContent =
        s.delivered || 0;

    document
      .getElementById('statDelay')
      .textContent =
        s.delay || 0;


    renderProjects(
      result.projects || []
    );

  } catch (err) {

    handleApiError(err);

  }

}


function renderProjects(projects) {

  const tbody =
    document.getElementById(
      'projectTable'
    );

  if (!projects.length) {

    tbody.innerHTML =
      `<tr>
        <td colspan="5">Tidak ada data</td>
      </tr>`;

    return;

  }

  tbody.innerHTML =
    projects.map(p => `
      <tr>
        <td><strong>${esc(p.project)}</strong></td>
        <td>${p.total || 0}</td>
        <td>${p.onTrip || 0}</td>
        <td>${p.delivered || 0}</td>
        <td>
          <span class="badge ${p.late ? 'danger' : 'success'}">
            ${p.late || 0}
          </span>
        </td>
      </tr>
    `).join('');

}


/* =========================================================
   SEARCH AWB
========================================================= */

async function searchAWB() {

  const awb =
    document
      .getElementById('awbSearch')
      .value
      .trim();

  if (!awb) {

    toast('Masukkan nomor AWB');

    return;

  }

  const container =
    document.getElementById(
      'searchResult'
    );

  container.innerHTML =
    '<div class="panel">Loading...</div>';

  try {

    const result =
      await apiGet('searchAWB', {
        awb
      });

    if (!result.success) {
      throw new Error(result.error);
    }

    state.currentTrip =
      result.trip;

    container.innerHTML =
      renderTripDetail(
        result.trip,
        result.timeline || []
      );

  } catch (err) {

    container.innerHTML =
      `<div class="panel">
        <div class="error-box">
          ${esc(err.message)}
        </div>
      </div>`;

  }

}


/* =========================================================
   TRIP DETAIL
========================================================= */

function renderTripDetail(
  trip,
  timeline
) {

  if (!trip) {
    return '<div class="panel">Trip tidak ditemukan</div>';
  }

  const fields = [

    ['AWB', trip.awb],
    ['Sales Order', trip.salesOrder],
    ['Project', trip.projectName],
    ['Detail Project', trip.detailProject],

    ['Pickup Date', trip.pickupDate],
    ['Date Send', trip.dateSend],

    ['Origin Address', trip.originAddress],
    ['Origin', trip.origin],
    ['Destination', trip.destination],
    ['Last Destination', trip.lastDestination],

    ['Type Trip', trip.typeTrip],
    ['SLA Type', trip.slaType],

    ['Logistic Partner', trip.logisticPartnerType],
    ['Vendor', trip.logisticPartnerName],

    ['Driver 1', trip.driver1],
    ['Driver 2', trip.driver2],
    ['Unit', trip.unitType],
    ['Nopol', trip.nopol],

    ['Start Time', trip.startTime1],
    ['End Time', trip.endTime1],

    ['SLA Database', trip.slaDatabase],
    ['SLA Performance', trip.slaPerformance],
    ['Performance', trip.performance],

    ['Trip Status', trip.tripStatus],
    ['Date Delivered', trip.dateDelivered]

  ];

  return `
    <div class="trip-detail">

      <div class="detail-header">

        <div>
          <h3>${esc(trip.awb)}</h3>
          <div class="muted">
            ${esc(trip.route || '-')}
          </div>
        </div>

        <div>
          ${statusBadge(trip.tripStatus)}
          ${performanceBadge(trip.performance)}
        </div>

      </div>

      <div class="detail-grid">

        ${fields.map(f => `
          <div class="detail-item">

            <small>${esc(f[0])}</small>

            <strong>
              ${esc(f[1] || '-')}
            </strong>

          </div>
        `).join('')}

      </div>

      <div class="section-head">
        <div>
          <h3>Tracking Timeline</h3>
        </div>
      </div>

      ${renderTimeline(timeline)}

    </div>
  `;

}


/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline(items) {

  if (!items || !items.length) {

    return `
      <div class="timeline empty">
        Belum ada timeline monitoring.
      </div>
    `;

  }

  return `
    <div class="timeline">

      ${items.map(item => `

        <div class="timeline-item">

          <div class="timeline-dot"></div>

          <div class="timeline-time">
            ${esc(item.time || '-')}
          </div>

          <div class="timeline-title">
            ${esc(item.title || item.type || 'Update')}
          </div>

          ${
            item.keterangan
              ? `<div class="timeline-text">
                   ${esc(item.keterangan)}
                 </div>`
              : ''
          }

          ${
            item.kendala
              ? `<div class="timeline-text">
                   ⚠ ${esc(item.kendala)}
                 </div>`
              : ''
          }

          ${
            item.pic
              ? `<div class="timeline-text">
                   PIC: ${esc(item.pic)}
                 </div>`
              : ''
          }

          ${
            item.photo
              ? `<img class="timeline-photo"
                      src="${esc(item.photo)}"
                      alt="Foto monitoring"
                      loading="lazy">`
              : ''
          }

        </div>

      `).join('')}

    </div>
  `;

}


/* =========================================================
   MONITORING
========================================================= */

async function loadMonitoringAWB() {

  const awb =
    document
      .getElementById('monitorAWB')
      .value
      .trim();

  if (!awb) {

    toast('Masukkan AWB');

    return;

  }

  try {

    const result =
      await apiGet('searchAWB', {
        awb
      });

    if (!result.success) {
      throw new Error(result.error);
    }

    state.currentTrip =
      result.trip;

    const info =
      document.getElementById(
        'monitorTripInfo'
      );

    info.classList.remove('hidden');

    info.innerHTML = `
      <strong>${esc(result.trip.awb)}</strong><br>
      ${esc(result.trip.projectName || '-')}<br>
      ${esc(result.trip.route || '-')}<br>
      ${esc(result.trip.nopol || '-')}
    `;

    document
      .getElementById('monitorTimeline')
      .classList.remove('empty');

    document
      .getElementById('monitorTimeline')
      .innerHTML =
        renderTimeline(
          result.timeline || []
        );

  } catch (err) {

    toast(err.message);

  }

}


/* =========================================================
   SAVE MONITORING
========================================================= */

async function saveMonitoring() {

  const awb =
    document
      .getElementById('monitorAWB')
      .value
      .trim();

  if (!awb) {

    toast('AWB wajib diisi');

    return;

  }


  const kendala =
    document
      .getElementById('kendalaSelect')
      .value;

  const keterangan =
    document
      .getElementById('monitorKeterangan')
      .value
      .trim();

  const jam =
    document
      .getElementById('jamUpdate')
      .value;


  const file =
    document
      .getElementById('monitorPhoto')
      .files[0];


  try {

    let photoUrl = '';

    /* Upload foto terlebih dahulu */

    if (file) {

      toast('Mengupload foto...');

      const base64 =
        await fileToBase64(file);

      const upload =
        await apiPost(
          'uploadPhoto',
          {
            awb,
            kendala:
              kendala || 'UPDATE',
            base64,
            mimeType: file.type
          }
        );

      if (!upload.success) {
        throw new Error(
          upload.error ||
          'Upload foto gagal'
        );
      }

      photoUrl =
        upload.url || '';

    }


    const result =
      await apiPost(
        'saveMonitoring',
        {
          awb,
          jamUpdate:
            jam === 'MANUAL'
              ? new Date().toISOString()
              : jam,
          kendala,
          keterangan,
          foto: photoUrl,
          pic:
            state.user?.nama ||
            state.user?.username ||
            ''
        }
      );


    if (!result.success) {
      throw new Error(
        result.error ||
        'Gagal menyimpan monitoring'
      );
    }


    toast(
      'Monitoring berhasil disimpan'
    );


    document
      .getElementById('monitorKeterangan')
      .value = '';

    document
      .getElementById('monitorPhoto')
      .value = '';

    document
      .getElementById('photoPreview')
      .classList.add('hidden');


    await loadMonitoringAWB();


  } catch (err) {

    toast(err.message);

  }

}


/* =========================================================
   PHOTO PREVIEW
========================================================= */

function previewPhoto(e) {

  const file =
    e.target.files[0];

  const preview =
    document.getElementById(
      'photoPreview'
    );

  if (!file) {

    preview.classList.add('hidden');

    return;

  }

  const url =
    URL.createObjectURL(file);

  preview.innerHTML =
    `<img src="${url}" alt="Preview">`;

  preview.classList.remove('hidden');

}


/* =========================================================
   KENDALA
========================================================= */

async function loadKendala() {

  try {

    const result =
      await apiGet('getKendala');

    if (!result.success) {
      throw new Error(result.error);
    }

    state.kendala =
      result.kendala || [];

    const select =
      document.getElementById(
        'kendalaSelect'
      );

    select.innerHTML =
      `<option value="">
        Tidak ada kendala
      </option>` +
      state.kendala
        .map(k =>
          `<option value="${esc(k)}">
             ${esc(k)}
           </option>`
        )
        .join('');


    const list =
      document.getElementById(
        'kendalaList'
      );

    list.innerHTML =
      state.kendala
        .map(k =>
          `<span class="tag">
             ${esc(k)}
           </span>`
        )
        .join('');

  } catch (err) {

    handleApiError(err);

  }

}


async function saveKendala() {

  const input =
    document.getElementById(
      'newKendala'
    );

  const value =
    input.value.trim();

  if (!value) {

    toast('Nama kendala wajib diisi');

    return;

  }

  try {

    const result =
      await apiPost(
        'saveKendala',
        {
          kendala: value
        }
      );

    if (!result.success) {
      throw new Error(result.error);
    }

    input.value = '';

    toast(
      'Kendala berhasil ditambahkan'
    );

    loadKendala();

  } catch (err) {

    toast(err.message);

  }

}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {

  try {

    const result =
      await apiGet('getProjects');

    if (!result.success) return;

    const select =
      document.getElementById(
        'liveProject'
      );

    select.innerHTML =
      `<option value="">
        Semua Project
      </option>` +
      (result.projects || [])
        .map(p =>
          `<option value="${esc(p)}">
             ${esc(p)}
           </option>`
        )
        .join('');

  } catch (err) {

    console.error(err);

  }

}


/* =========================================================
   LIVE TRIPS
========================================================= */

async function loadLiveTrips() {

  const container =
    document.getElementById(
      'liveContainer'
    );

  container.innerHTML =
    '<div class="panel">Loading...</div>';

  try {

    const result =
      await apiGet(
        'getLiveTrips',
        {
          search:
            document
              .getElementById(
                'liveSearch'
              ).value,

          project:
            document
              .getElementById(
                'liveProject'
              ).value,

          tripStatus:
            document
              .getElementById(
                'liveStatus'
              ).value,

          performance:
            document
              .getElementById(
                'livePerformance'
              ).value,

          page: 1,
          limit: 60
        }
      );


    if (!result.success) {
      throw new Error(result.error);
    }


    const trips =
      result.data || [];


    if (!trips.length) {

      container.innerHTML =
        '<div class="panel">Tidak ada trip.</div>';

      return;

    }


    container.innerHTML =
      trips
        .map(renderLiveTrip)
        .join('');


  } catch (err) {

    container.innerHTML =
      `<div class="panel">
        ${esc(err.message)}
      </div>`;

  }

}


function renderLiveTrip(trip) {

  return `
    <div class="trip-card">

      <div class="detail-header">

        <div>
          <h4>${esc(trip.awb)}</h4>
          <small>${esc(trip.projectName || '-')}</small>
        </div>

        ${statusBadge(trip.tripStatus)}

      </div>

      <div class="trip-route">
        ${esc(trip.route || '-')}
      </div>

      <div class="trip-meta">

        <div class="meta">
          <small>TYPE TRIP</small>
          <strong>${esc(trip.typeTrip || '-')}</strong>
        </div>

        <div class="meta">
          <small>NOPOL</small>
          <strong>${esc(trip.nopol || '-')}</strong>
        </div>

        <div class="meta">
          <small>VENDOR</small>
          <strong>${esc(trip.logisticPartnerName || '-')}</strong>
        </div>

        <div class="meta">
          <small>PERFORMANCE</small>
          <strong>${esc(trip.performance || '-')}</strong>
        </div>

      </div>

      <button
        class="btn ghost full"
        onclick="openAWB('${js(trip.awb)}')">
        Detail & Tracking
      </button>

    </div>
  `;

}


function openAWB(awb) {

  switchPage('search');

  document
    .getElementById('awbSearch')
    .value = awb;

  searchAWB();

}


/* =========================================================
   REPORT
========================================================= */

async function loadReport() {

  const container =
    document.getElementById(
      'reportContainer'
    );

  container.innerHTML =
    '<div class="panel">Loading...</div>';

  try {

    const result =
      await apiGet('getReport');

    if (!result.success) {
      throw new Error(result.error);
    }

    const report =
      result.report || {};

    container.innerHTML =
      renderReportSection(
        'Projects',
        report.projects
      ) +
      renderReportSection(
        'Type Trip',
        report.typeTrip
      ) +
      renderReportSection(
        'Performance',
        report.performance
      ) +
      renderReportSection(
        'Trip Status',
        report.tripStatus
      ) +
      renderReportSection(
        'Logistic Partner',
        report.logisticPartner
      );

  } catch (err) {

    container.innerHTML =
      `<div class="panel">
        ${esc(err.message)}
      </div>`;

  }

}


function renderReportSection(
  title,
  data
) {

  if (!data) return '';

  return `
    <div class="report-card">

      <h3>${esc(title)}</h3>

      ${Object.entries(data)
        .sort((a,b) => b[1] - a[1])
        .map(([key,value]) => `
          <div class="report-row">
            <span>${esc(key || 'UNDEFINED')}</span>
            <strong>${value}</strong>
          </div>
        `)
        .join('')}

    </div>
  `;

}


/* =========================================================
   REFRESH
========================================================= */

function refreshCurrentPage() {

  const active =
    document.querySelector(
      '.page.active'
    );

  if (!active) return;

  const page =
    active.id.replace(
      'page-',
      ''
    );

  switchPage(page);

  toast('Data diperbarui');

}


/* =========================================================
   HELPERS
========================================================= */

function statusBadge(status) {

  if (!status) return '';

  let cls = '';

  if (status === 'DELIVERED') {
    cls = 'success';
  }

  else if (status === 'DELAY') {
    cls = 'danger';
  }

  else if (status === 'ON TRIP') {
    cls = 'warning';
  }

  return `
    <span class="badge ${cls}">
      ${esc(status)}
    </span>
  `;

}


function performanceBadge(value) {

  if (!value) return '';

  const cls =
    value === 'LATE'
      ? 'danger'
      : 'success';

  return `
    <span class="badge ${cls}">
      ${esc(value)}
    </span>
  `;

}


function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = reject;

      reader.readAsDataURL(file);

    }
  );

}


function updateClock() {

  const now =
    new Date();

  document
    .getElementById('clock')
    .textContent =
      now.toLocaleString(
        'id-ID',
        {
          dateStyle: 'medium',
          timeStyle: 'medium'
        }
      );

}


function toast(message) {

  const el =
    document.getElementById(
      'toast'
    );

  el.textContent =
    message;

  el.classList.add('show');

  setTimeout(() => {
    el.classList.remove('show');
  }, 2500);

}


function handleApiError(err) {

  console.error(err);

  if (
    String(err.message)
      .toLowerCase()
      .includes('session')
  ) {

    logout();

    return;

  }

  toast(
    err.message ||
    'Terjadi kesalahan'
  );

}


function esc(value) {

  return String(
    value == null
      ? ''
      : value
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


function js(value) {

  return String(
    value == null ? '' : value
  )
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

}
