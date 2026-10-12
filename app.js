/**
 * MEDX — Hospital Records & Clinical System
 * Editorial Paper & Ink Architecture
 * Zero hardcoded dummy data • Local Storage persistence
 */

(function () {
  'use strict';

  // --- INITIAL EMPTY SCHEMA ---
  const DEFAULT_EMPTY_DATA = {
    patients: [],
    doctors: [],
    appointments: [],
    records: []
  };

  // --- APPLICATION STATE ---
  const STORAGE_KEY = 'medx_hospital_records_v3';
  let state = loadState();
  let currentActiveView = 'dashboard';

  function loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Storage load warning:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_EMPTY_DATA));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Storage save error:", e);
    }
    renderApp();
  }

  // Helper getters
  function getPatient(id) {
    return state.patients.find(p => p.id === Number(id)) || { name: `Patient #${id}` };
  }
  function getDoctor(id) {
    return state.doctors.find(d => d.id === Number(id)) || { name: `Doctor #${id}` };
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="font-family:var(--font-mono); font-weight:700;">•</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- NAVIGATION ---
  const HERO_TITLES = {
    dashboard: "RECORDS. IN ORDER.",
    patients: "PATIENT ADMISSIONS.",
    doctors: "ATTENDING PHYSICIANS.",
    appointments: "SCHEDULED CONSULTATIONS.",
    records: "CLINICAL ARCHIVES."
  };

  function setupNavigation() {
    // Primary top nav & sub-nav tabs
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        switchView(targetView);
      });
    });

    // Stat card shortcuts
    document.querySelectorAll('[data-goto]').forEach(card => {
      card.addEventListener('click', () => {
        const targetView = card.dataset.goto;
        switchView(targetView);
      });
    });

    // Dashboard quick link
    document.getElementById('link-goto-patients')?.addEventListener('click', () => switchView('patients'));

    // Quick Action shortcuts on Right Side Card
    document.getElementById('qa-patient')?.addEventListener('click', () => openPatientModal());
    document.getElementById('qa-doctor')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('qa-appointment')?.addEventListener('click', () => openAppointmentModal());
    document.getElementById('qa-record')?.addEventListener('click', () => openRecordModal());

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter;
        if (filter === 'ALL') switchView('dashboard');
        else if (filter === 'PATIENTS') switchView('patients');
        else if (filter === 'DOCTORS') switchView('doctors');
        else if (filter === 'APPOINTMENTS') switchView('appointments');
        else if (filter === 'RECORDS') switchView('records');
      });
    });
  }

  function switchView(viewName) {
    currentActiveView = viewName;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });
    document.querySelectorAll('.sub-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });

    // Update view panels
    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.id === `view-${viewName}`);
    });

    // Update Hero Title
    const heroTitleEl = document.getElementById('page-hero-title');
    if (heroTitleEl && HERO_TITLES[viewName]) {
      heroTitleEl.textContent = HERO_TITLES[viewName];
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- MODAL CONTROLLERS ---
  function setupModals() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // Modal Triggers
    document.getElementById('btn-open-patient-modal')?.addEventListener('click', () => openPatientModal());
    document.getElementById('btn-open-doctor-modal')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('btn-open-appointment-modal')?.addEventListener('click', () => openAppointmentModal());
    document.getElementById('btn-open-record-modal')?.addEventListener('click', () => openRecordModal());

    // Purge Data Button
    document.getElementById('btn-purge-data')?.addEventListener('click', () => {
      if (confirm("WARNING: Clear all hospital records from local database? This action cannot be reversed.")) {
        state = JSON.parse(JSON.stringify(DEFAULT_EMPTY_DATA));
        saveState();
        showToast("DATABASE PURGED • ALL RECORDS CLEARED");
      }
    });

    // Form Handlers
    setupPatientForm();
    setupDoctorForm();
    setupAppointmentForm();
    setupRecordForm();
  }

  // --- PATIENTS CRUD ---
  function openPatientModal(patient = null) {
    const modal = document.getElementById('modal-patient');
    const title = document.getElementById('modal-patient-title');
    document.getElementById('patient-id').value = patient ? patient.id : '';
    document.getElementById('patient-name').value = patient ? patient.name : '';
    document.getElementById('patient-age').value = patient ? patient.age : '';
    document.getElementById('patient-gender').value = patient ? patient.gender : 'Male';
    document.getElementById('patient-phone').value = patient ? patient.phone : '';
    document.getElementById('patient-blood').value = patient ? patient.bloodGroup : 'O+';
    document.getElementById('patient-address').value = patient ? patient.address : '';
    title.textContent = patient ? "Edit Patient Details" : "Register Patient";
    modal.classList.add('open');
  }

  function setupPatientForm() {
    const form = document.getElementById('form-patient');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('patient-id').value;
      const patientData = {
        name: document.getElementById('patient-name').value.trim(),
        age: parseInt(document.getElementById('patient-age').value, 10),
        gender: document.getElementById('patient-gender').value,
        phone: document.getElementById('patient-phone').value.trim(),
        bloodGroup: document.getElementById('patient-blood').value,
        address: document.getElementById('patient-address').value.trim(),
        createdAt: new Date().toISOString().split('T')[0]
      };

      if (id) {
        const index = state.patients.findIndex(p => p.id === Number(id));
        if (index !== -1) {
          state.patients[index] = { ...state.patients[index], ...patientData, id: Number(id) };
          showToast(`UPDATED: ${patientData.name.toUpperCase()}`);
        }
      } else {
        const newId = state.patients.length ? Math.max(...state.patients.map(p => p.id)) + 1 : 1;
        state.patients.push({ id: newId, ...patientData });
        showToast(`REGISTERED: ${patientData.name.toUpperCase()} (#${newId})`);
      }

      document.getElementById('modal-patient').classList.remove('open');
      saveState();
    });
  }

  window.deletePatient = function(id) {
    const patient = getPatient(id);
    if (confirm(`Delete patient "${patient.name}" and associated visits?`)) {
      state.patients = state.patients.filter(p => p.id !== id);
      state.appointments = state.appointments.filter(a => a.patientId !== id);
      state.records = state.records.filter(r => r.patientId !== id);
      saveState();
      showToast(`DELETED: PATIENT #${id}`);
    }
  };

  window.editPatient = function(id) {
    const p = state.patients.find(x => x.id === id);
    if (p) openPatientModal(p);
  };

  // --- DOCTORS CRUD ---
  function openDoctorModal(doctor = null) {
    const modal = document.getElementById('modal-doctor');
    const title = document.getElementById('modal-doctor-title');
    document.getElementById('doctor-id').value = doctor ? doctor.id : '';
    document.getElementById('doctor-name').value = doctor ? doctor.name : '';
    document.getElementById('doctor-specialty').value = doctor ? doctor.specialty : 'General Medicine';
    document.getElementById('doctor-phone').value = doctor ? doctor.phone : '';
    document.getElementById('doctor-room').value = doctor ? doctor.room : '';
    title.textContent = doctor ? "Edit Doctor Information" : "Register Medical Staff";
    modal.classList.add('open');
  }

  function setupDoctorForm() {
    const form = document.getElementById('form-doctor');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('doctor-id').value;
      const doctorData = {
        name: document.getElementById('doctor-name').value.trim(),
        specialty: document.getElementById('doctor-specialty').value,
        phone: document.getElementById('doctor-phone').value.trim(),
        room: document.getElementById('doctor-room').value.trim()
      };

      if (id) {
        const index = state.doctors.findIndex(d => d.id === Number(id));
        if (index !== -1) {
          state.doctors[index] = { ...state.doctors[index], ...doctorData, id: Number(id) };
          showToast(`UPDATED: ${doctorData.name.toUpperCase()}`);
        }
      } else {
        const newId = state.doctors.length ? Math.max(...state.doctors.map(d => d.id)) + 1 : 1;
        state.doctors.push({ id: newId, ...doctorData });
        showToast(`REGISTERED: ${doctorData.name.toUpperCase()} (#${newId})`);
      }

      document.getElementById('modal-doctor').classList.remove('open');
      saveState();
    });
  }

  window.deleteDoctor = function(id) {
    const doc = getDoctor(id);
    if (confirm(`Remove physician "${doc.name}" from medical directory?`)) {
      state.doctors = state.doctors.filter(d => d.id !== id);
      saveState();
      showToast(`DELETED: DOCTOR #${id}`);
    }
  };

  window.editDoctor = function(id) {
    const d = state.doctors.find(x => x.id === id);
    if (d) openDoctorModal(d);
  };

  // --- APPOINTMENTS CRUD ---
  function openAppointmentModal(appointment = null) {
    if (!state.patients.length) {
      alert("Please register at least one patient first.");
      openPatientModal();
      return;
    }
    if (!state.doctors.length) {
      alert("Please register at least one doctor first.");
      openDoctorModal();
      return;
    }

    const modal = document.getElementById('modal-appointment');
    const title = document.getElementById('modal-appointment-title');
    const patientSelect = document.getElementById('appointment-patient');
    const doctorSelect = document.getElementById('appointment-doctor');

    patientSelect.innerHTML = state.patients.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (#${p.id})</option>`).join('');
    doctorSelect.innerHTML = state.doctors.map(d => `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.specialty)}</option>`).join('');

    document.getElementById('appointment-id').value = appointment ? appointment.id : '';
    if (appointment) patientSelect.value = appointment.patientId;
    if (appointment) doctorSelect.value = appointment.doctorId;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = appointment ? appointment.visitDate : today;
    document.getElementById('appointment-time').value = appointment ? appointment.visitTime : '10:00';
    document.getElementById('appointment-reason').value = appointment ? appointment.reason : '';
    document.getElementById('appointment-status').value = appointment ? appointment.status : 'Scheduled';

    title.textContent = appointment ? "Edit Appointment" : "Schedule Patient Visit";
    modal.classList.add('open');
  }

  function setupAppointmentForm() {
    const form = document.getElementById('form-appointment');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('appointment-id').value;
      const apptData = {
        patientId: Number(document.getElementById('appointment-patient').value),
        doctorId: Number(document.getElementById('appointment-doctor').value),
        visitDate: document.getElementById('appointment-date').value,
        visitTime: document.getElementById('appointment-time').value,
        reason: document.getElementById('appointment-reason').value.trim(),
        status: document.getElementById('appointment-status').value
      };

      if (id) {
        const index = state.appointments.findIndex(a => a.id === Number(id));
        if (index !== -1) {
          state.appointments[index] = { ...state.appointments[index], ...apptData, id: Number(id) };
          showToast(`UPDATED: APPOINTMENT #${id}`);
        }
      } else {
        const newId = state.appointments.length ? Math.max(...state.appointments.map(a => a.id)) + 1 : 1;
        state.appointments.push({ id: newId, ...apptData });
        showToast(`SCHEDULED: APPOINTMENT #${newId}`);
      }

      document.getElementById('modal-appointment').classList.remove('open');
      saveState();
    });
  }

  window.deleteAppointment = function(id) {
    if (confirm("Cancel and delete this appointment?")) {
      state.appointments = state.appointments.filter(a => a.id !== id);
      saveState();
      showToast(`DELETED: APPOINTMENT #${id}`);
    }
  };

  window.editAppointment = function(id) {
    const a = state.appointments.find(x => x.id === id);
    if (a) openAppointmentModal(a);
  };

  // --- CLINICAL RECORDS CRUD ---
  function openRecordModal(record = null) {
    if (!state.patients.length) {
      alert("Please register at least one patient first.");
      openPatientModal();
      return;
    }

    const modal = document.getElementById('modal-record');
    const title = document.getElementById('modal-record-title');
    const patientSelect = document.getElementById('record-patient');

    patientSelect.innerHTML = state.patients.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (#${p.id})</option>`).join('');

    document.getElementById('record-id').value = record ? record.id : '';
    if (record) patientSelect.value = record.patientId;
    document.getElementById('record-date').value = record ? record.recordDate : new Date().toISOString().split('T')[0];
    document.getElementById('record-diagnosis').value = record ? record.diagnosis : '';
    document.getElementById('record-treatment').value = record ? record.treatment : '';
    document.getElementById('record-notes').value = record ? record.notes : '';

    title.textContent = record ? "Edit Diagnostic Record" : "Add Diagnostic Record";
    modal.classList.add('open');
  }

  function setupRecordForm() {
    const form = document.getElementById('form-record');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('record-id').value;
      const recData = {
        patientId: Number(document.getElementById('record-patient').value),
        recordDate: document.getElementById('record-date').value,
        diagnosis: document.getElementById('record-diagnosis').value.trim(),
        treatment: document.getElementById('record-treatment').value.trim(),
        notes: document.getElementById('record-notes').value.trim()
      };

      if (id) {
        const index = state.records.findIndex(r => r.id === Number(id));
        if (index !== -1) {
          state.records[index] = { ...state.records[index], ...recData, id: Number(id) };
          showToast(`UPDATED: RECORD #${id}`);
        }
      } else {
        const newId = state.records.length ? Math.max(...state.records.map(r => r.id)) + 1 : 1;
        state.records.push({ id: newId, ...recData });
        showToast(`LOGGED: RECORD #${newId}`);
      }

      document.getElementById('modal-record').classList.remove('open');
      saveState();
    });
  }

  window.deleteRecord = function(id) {
    if (confirm("Permanently delete this clinical diagnostic record?")) {
      state.records = state.records.filter(r => r.id !== id);
      saveState();
      showToast(`DELETED: RECORD #${id}`);
    }
  };

  window.viewRecord = function(id) {
    const rec = state.records.find(r => r.id === id);
    if (!rec) return;
    const patient = getPatient(rec.patientId);
    const content = document.getElementById('record-detail-content');
    content.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">PATIENT</span>
        <span class="detail-value"><strong>${escapeHtml(patient.name)}</strong> (#${rec.patientId})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">RECORD DATE</span>
        <span class="detail-value" style="font-family:var(--font-mono);">${rec.recordDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">CLINICAL DIAGNOSIS</span>
        <span class="detail-value" style="font-weight:700;">${escapeHtml(rec.diagnosis)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">TREATMENT & MEDICATION</span>
        <div class="detail-box">${escapeHtml(rec.treatment)}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">CLINICAL NOTES</span>
        <div class="detail-box">${escapeHtml(rec.notes || "No notes logged.")}</div>
      </div>
    `;
    document.getElementById('modal-view-record').classList.add('open');
  };

  // --- SEARCH FILTERS ---
  function setupSearchFilter() {
    document.getElementById('global-search')?.addEventListener('input', () => {
      renderApp();
    });
    document.getElementById('filter-appointment-status')?.addEventListener('change', renderAppointments);
  }

  // --- RENDER APP ---
  function renderApp() {
    renderMetrics();
    renderPatients();
    renderDoctors();
    renderAppointments();
    renderRecords();
    renderTodaySchedule();
  }

  function renderMetrics() {
    const pCount = state.patients.length;
    const dCount = state.doctors.length;
    const aCount = state.appointments.length;
    const rCount = state.records.length;

    document.getElementById('metric-patients-count').textContent = pCount;
    document.getElementById('metric-doctors-count').textContent = dCount;
    document.getElementById('metric-appointments-count').textContent = aCount;
    document.getElementById('metric-records-count').textContent = rCount;

    const scheduled = state.appointments.filter(a => a.status === 'Scheduled').length;
    document.getElementById('metric-scheduled-sub').textContent = `${scheduled} Scheduled`;
  }

  function renderPatients() {
    const tbody = document.getElementById('tbody-patients');
    const dashTbody = document.getElementById('tbody-dash-patients');
    const query = (document.getElementById('global-search')?.value || '').toLowerCase();

    const filtered = state.patients.filter(p => {
      return p.name.toLowerCase().includes(query) ||
             p.phone.toLowerCase().includes(query) ||
             p.bloodGroup.toLowerCase().includes(query) ||
             p.address.toLowerCase().includes(query);
    });

    // Render Dashboard preview table
    if (dashTbody) {
      if (!state.patients.length) {
        dashTbody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-table-cell">
              <div class="empty-state-box">
                <div class="empty-state-h">No patients registered.</div>
                <div class="empty-state-p">Click "+ Register Patient" on the right to add admissions.</div>
              </div>
            </td>
          </tr>
        `;
      } else {
        dashTbody.innerHTML = state.patients.slice(0, 5).map(p => `
          <tr>
            <td class="td-mono">#${p.id}</td>
            <td class="td-bold">${escapeHtml(p.name)}</td>
            <td>${p.age} YRS • ${escapeHtml(p.gender).toUpperCase()}</td>
            <td>${escapeHtml(p.phone)}</td>
            <td><span class="badge-blood">${p.bloodGroup}</span></td>
            <td>${escapeHtml(p.address)}</td>
          </tr>
        `).join('');
      }
    }

    // Render Main Patients table
    if (tbody) {
      if (!filtered.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-table-cell">
              <div class="empty-state-box">
                <div class="empty-state-h">${query ? 'No matching patients.' : 'No patients registered.'}</div>
                <div class="empty-state-p">${query ? 'Try modifying your search keywords.' : 'Click "+ REGISTER PATIENT" above to add an admission.'}</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(p => `
        <tr>
          <td class="td-mono">#${p.id}</td>
          <td class="td-bold">${escapeHtml(p.name)}</td>
          <td>${p.age} YRS • ${escapeHtml(p.gender).toUpperCase()}</td>
          <td>${escapeHtml(p.phone)}</td>
          <td><span class="badge-blood">${p.bloodGroup}</span></td>
          <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(p.address)}</td>
          <td class="text-right">
            <button class="btn-action-icon" onclick="editPatient(${p.id})" title="Edit Patient">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="btn-action-icon danger" onclick="deletePatient(${p.id})" title="Delete Patient">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  function renderDoctors() {
    const tbody = document.getElementById('tbody-doctors');
    if (!tbody) return;
    const query = (document.getElementById('global-search')?.value || '').toLowerCase();

    const filtered = state.doctors.filter(d => {
      return d.name.toLowerCase().includes(query) ||
             d.specialty.toLowerCase().includes(query) ||
             d.room.toLowerCase().includes(query);
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-table-cell">
            <div class="empty-state-box">
              <div class="empty-state-h">${query ? 'No matching doctors.' : 'No medical staff recorded.'}</div>
              <div class="empty-state-p">${query ? 'Check spelling or clear the search filter.' : 'Click "+ ADD DOCTOR" to record hospital staff.'}</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td class="td-mono">#${d.id}</td>
        <td class="td-bold">${escapeHtml(d.name)}</td>
        <td><span class="badge-specialty">${escapeHtml(d.specialty).toUpperCase()}</span></td>
        <td>${escapeHtml(d.phone)}</td>
        <td>${escapeHtml(d.room)}</td>
        <td class="text-right">
          <button class="btn-action-icon" onclick="editDoctor(${d.id})" title="Edit Doctor">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="btn-action-icon danger" onclick="deleteDoctor(${d.id})" title="Delete Doctor">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderAppointments() {
    const tbody = document.getElementById('tbody-appointments');
    if (!tbody) return;
    const query = (document.getElementById('global-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('filter-appointment-status')?.value || 'ALL';

    const filtered = state.appointments.filter(a => {
      const p = getPatient(a.patientId);
      const d = getDoctor(a.doctorId);
      const matchesQuery = p.name.toLowerCase().includes(query) ||
                           d.name.toLowerCase().includes(query) ||
                           a.reason.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-cell">
            <div class="empty-state-box">
              <div class="empty-state-h">${query ? 'No matching appointments.' : 'No appointments scheduled.'}</div>
              <div class="empty-state-p">${query ? 'Clear your search filters.' : 'Click "+ SCHEDULE VISIT" above to book an appointment.'}</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(a => {
      const p = getPatient(a.patientId);
      const d = getDoctor(a.doctorId);
      const statusClass = a.status.toLowerCase();
      return `
        <tr>
          <td class="td-mono">#${a.id}</td>
          <td class="td-bold">${escapeHtml(p.name)}</td>
          <td>${escapeHtml(d.name)}</td>
          <td style="font-family:var(--font-mono); font-size:12px;">${a.visitDate} @ ${a.visitTime}</td>
          <td>${escapeHtml(a.reason)}</td>
          <td><span class="badge-status ${statusClass}">${a.status}</span></td>
          <td class="text-right">
            <button class="btn-action-icon" onclick="editAppointment(${a.id})" title="Edit Appointment">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="btn-action-icon danger" onclick="deleteAppointment(${a.id})" title="Cancel Appointment">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderRecords() {
    const tbody = document.getElementById('tbody-records');
    if (!tbody) return;
    const query = (document.getElementById('global-search')?.value || '').toLowerCase();

    const filtered = state.records.filter(r => {
      const p = getPatient(r.patientId);
      return p.name.toLowerCase().includes(query) ||
             r.diagnosis.toLowerCase().includes(query) ||
             r.treatment.toLowerCase().includes(query) ||
             r.notes.toLowerCase().includes(query);
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-cell">
            <div class="empty-state-box">
              <div class="empty-state-h">${query ? 'No matching clinical records.' : 'No clinical records logged.'}</div>
              <div class="empty-state-p">${query ? 'Try different keywords.' : 'Click "+ ADD RECORD" to document patient diagnoses and care plans.'}</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const p = getPatient(r.patientId);
      return `
        <tr>
          <td class="td-mono">#${r.id}</td>
          <td class="td-bold">${escapeHtml(p.name)}</td>
          <td style="font-family:var(--font-mono); font-size:12px;">${r.recordDate}</td>
          <td style="font-weight:700;">${escapeHtml(r.diagnosis)}</td>
          <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(r.treatment)}</td>
          <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-muted);">${escapeHtml(r.notes || "—")}</td>
          <td class="text-right">
            <button class="btn-action-icon" onclick="viewRecord(${r.id})" title="View Full Details">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-action-icon danger" onclick="deleteRecord(${r.id})" title="Delete Record">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Right Side Card (CampusBite "YOUR TRAY" Style)
  function renderTodaySchedule() {
    const container = document.getElementById('today-schedule-body');
    if (!container) return;

    if (!state.appointments.length) {
      container.innerHTML = `
        <div class="empty-tray">
          <div class="empty-tray-title">Your schedule is empty.</div>
          <div class="empty-tray-desc">Book consultations from the appointments tab to track today's rounds.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = state.appointments.slice(0, 6).map(a => {
      const p = getPatient(a.patientId);
      const d = getDoctor(a.doctorId);
      return `
        <div class="schedule-item">
          <div class="schedule-info">
            <span class="schedule-patient">${escapeHtml(p.name)}</span>
            <span class="schedule-doc">${escapeHtml(d.name)} (${escapeHtml(a.reason)})</span>
          </div>
          <span class="schedule-time-badge">${a.visitTime}</span>
        </div>
      `;
    }).join('');
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupModals();
    setupSearchFilter();
    renderApp();
  });

})();
