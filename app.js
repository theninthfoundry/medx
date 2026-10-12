/**
 * MEDX — Hospital Records & Clinical System
 * Minimalist High-Precision Records & Clinical Management System
 * Complete CRUD operations, real-time metrics, live search, and modal handling
 */

(function () {
  'use strict';

  // --- DEMO SEED DATA (AVAILABLE VIA "DEMO" BUTTON) ---
  const DEMO_RECORDS = {
    patients: [
      { id: 1, name: "Marcus Blackwell", age: 48, gender: "Male", phone: "+1 (555) 234-8901", bloodGroup: "O+", address: "742 Evergreen Terrace, West Wing", createdAt: "2026-09-12" },
      { id: 2, name: "Elena Rostova", age: 34, gender: "Female", phone: "+1 (555) 412-9903", bloodGroup: "A-", address: "14B Kestrel Boulevard, North Ward", createdAt: "2026-09-18" },
      { id: 3, name: "David Sterling", age: 62, gender: "Male", phone: "+1 (555) 872-3104", bloodGroup: "B+", address: "89 St. Jude Crescent, Suite 4A", createdAt: "2026-09-25" },
      { id: 4, name: "Aria Thorne", age: 29, gender: "Female", phone: "+1 (555) 604-5120", bloodGroup: "AB+", address: "205 Pine Ridge Lane", createdAt: "2026-10-01" }
    ],
    doctors: [
      { id: 1, name: "Dr. Eleanor Vance, MD", specialty: "Cardiology", phone: "+1 (555) 019-3321", room: "Suite 401, East Wing" },
      { id: 2, name: "Dr. Jonathan Reyes, MD", specialty: "Neurology", phone: "+1 (555) 019-8832", room: "Clinic 204, Tower B" },
      { id: 3, name: "Dr. Sarah Chen, MD", specialty: "Pediatrics", phone: "+1 (555) 019-5510", room: "Pediatrics Center, 1st Fl" }
    ],
    appointments: [
      { id: 1, patientId: 1, doctorId: 1, visitDate: "2026-10-14", visitTime: "09:30", reason: "Follow-up ECG & hypertension check", status: "Scheduled" },
      { id: 2, patientId: 2, doctorId: 2, visitDate: "2026-10-14", visitTime: "11:00", reason: "Migraine assessment & MRI review", status: "Scheduled" }
    ],
    records: [
      { id: 1, patientId: 1, recordDate: "2026-09-20", diagnosis: "Essential Stage 1 Hypertension", treatment: "Amlodipine 5mg QD; dietary sodium reduction", notes: "Rest ECG shows normal sinus rhythm. Follow-up scheduled in 4 weeks." },
      { id: 2, patientId: 2, recordDate: "2026-10-02", diagnosis: "Chronic Migraine with Visual Aura", treatment: "Sumatriptan 50mg PRN at onset; Topiramate 25mg daily", notes: "Triggers identified: stress and sleep disruption." }
    ]
  };

  const DEFAULT_EMPTY = {
    patients: [],
    doctors: [],
    appointments: [],
    records: []
  };

  const STORAGE_KEY = 'medx_hospital_records_v4';
  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          patients: Array.isArray(parsed.patients) ? parsed.patients : [],
          doctors: Array.isArray(parsed.doctors) ? parsed.doctors : [],
          appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
          records: Array.isArray(parsed.records) ? parsed.records : []
        };
      }
    } catch (e) {
      console.warn("Storage load warning:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_EMPTY));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Storage save error:", e);
    }
    renderApp();
  }

  function getPatient(id) {
    return state.patients.find(p => p.id === Number(id)) || { name: `Patient #${id}` };
  }

  function getDoctor(id) {
    return state.doctors.find(d => d.id === Number(id)) || { name: `Doctor #${id}` };
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span style="font-family:var(--font-mono); font-weight:700;">•</span> <span>${escapeHtml(msg)}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.25s ease';
      setTimeout(() => t.remove(), 250);
    }, 2600);
  }
  window.showToast = showToast;

  // --- NAVIGATION CONTROLLER ---
  const HERO_TITLES = {
    dashboard: "RECORDS. IN ORDER.",
    patients: "PATIENT ADMISSIONS.",
    doctors: "ATTENDING PHYSICIANS.",
    appointments: "SCHEDULED CONSULTATIONS.",
    records: "CLINICAL ARCHIVES."
  };

  const VIEW_TO_FILTER = {
    dashboard: 'ALL',
    patients: 'PATIENTS',
    doctors: 'DOCTORS',
    appointments: 'APPOINTMENTS',
    records: 'RECORDS'
  };

  window.switchView = function(viewName) {
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });
    document.querySelectorAll('.sub-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });
    const filter = VIEW_TO_FILTER[viewName] || 'ALL';
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.filter === filter);
    });
    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.id === `view-${viewName}`);
    });
    const heroEl = document.getElementById('page-hero-title');
    if (heroEl && HERO_TITLES[viewName]) {
      heroEl.textContent = HERO_TITLES[viewName];
    }
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.filterByTab = function(filter) {
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.filter === filter);
    });
    if (filter === 'ALL') switchView('dashboard');
    else if (filter === 'PATIENTS') switchView('patients');
    else if (filter === 'DOCTORS') switchView('doctors');
    else if (filter === 'APPOINTMENTS') switchView('appointments');
    else if (filter === 'RECORDS') switchView('records');
  };

  // --- MODAL CONTROLS ---
  window.closeAllModals = function() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  };

  // PATIENT MODAL
  window.openPatientModal = function(patient = null) {
    const modal = document.getElementById('modal-patient');
    if (!modal) return;
    document.getElementById('patient-id').value = patient ? patient.id : '';
    document.getElementById('patient-name').value = patient ? patient.name : '';
    document.getElementById('patient-age').value = patient ? patient.age : '';
    document.getElementById('patient-gender').value = patient ? patient.gender : 'Male';
    document.getElementById('patient-phone').value = patient ? patient.phone : '';
    document.getElementById('patient-blood').value = patient ? patient.bloodGroup : 'O+';
    document.getElementById('patient-address').value = patient ? patient.address : '';
    document.getElementById('modal-patient-title').textContent = patient ? "Edit Patient Details" : "Register Patient";
    modal.classList.add('open');
    setTimeout(() => document.getElementById('patient-name')?.focus(), 60);
  };

  window.editPatient = function(id) {
    const p = state.patients.find(x => x.id === Number(id));
    if (p) openPatientModal(p);
  };

  window.deletePatient = function(id) {
    id = Number(id);
    const p = getPatient(id);
    if (confirm(`Delete admission record for "${p.name}" (#${id})?`)) {
      state.patients = state.patients.filter(x => x.id !== id);
      state.appointments = state.appointments.filter(x => x.patientId !== id);
      state.records = state.records.filter(x => x.patientId !== id);
      saveState();
      showToast(`DELETED PATIENT #${id}`);
    }
  };

  // DOCTOR MODAL
  window.openDoctorModal = function(doctor = null) {
    const modal = document.getElementById('modal-doctor');
    if (!modal) return;
    document.getElementById('doctor-id').value = doctor ? doctor.id : '';
    document.getElementById('doctor-name').value = doctor ? doctor.name : '';
    document.getElementById('doctor-specialty').value = doctor ? doctor.specialty : 'General Medicine';
    document.getElementById('doctor-phone').value = doctor ? doctor.phone : '';
    document.getElementById('doctor-room').value = doctor ? doctor.room : '';
    document.getElementById('modal-doctor-title').textContent = doctor ? "Edit Doctor Information" : "Register Medical Staff";
    modal.classList.add('open');
    setTimeout(() => document.getElementById('doctor-name')?.focus(), 60);
  };

  window.editDoctor = function(id) {
    const d = state.doctors.find(x => x.id === Number(id));
    if (d) openDoctorModal(d);
  };

  window.deleteDoctor = function(id) {
    id = Number(id);
    const d = getDoctor(id);
    if (confirm(`Remove physician "${d.name}" (#${id}) from medical staff directory?`)) {
      state.doctors = state.doctors.filter(x => x.id !== id);
      saveState();
      showToast(`DELETED DOCTOR #${id}`);
    }
  };

  // APPOINTMENT MODAL
  window.openAppointmentModal = function(appointment = null) {
    if (!state.patients.length) {
      showToast("PLEASE REGISTER A PATIENT FIRST BEFORE SCHEDULING VISITS");
      openPatientModal();
      return;
    }
    if (!state.doctors.length) {
      showToast("PLEASE REGISTER MEDICAL STAFF FIRST BEFORE SCHEDULING VISITS");
      openDoctorModal();
      return;
    }

    const modal = document.getElementById('modal-appointment');
    if (!modal) return;
    const patientSelect = document.getElementById('appointment-patient');
    const doctorSelect = document.getElementById('appointment-doctor');

    patientSelect.innerHTML = state.patients.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (#${p.id})</option>`).join('');
    doctorSelect.innerHTML = state.doctors.map(d => `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.specialty)}</option>`).join('');

    document.getElementById('appointment-id').value = appointment ? appointment.id : '';
    if (appointment) {
      patientSelect.value = appointment.patientId;
      doctorSelect.value = appointment.doctorId;
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = appointment ? appointment.visitDate : today;
    document.getElementById('appointment-time').value = appointment ? appointment.visitTime : '10:00';
    document.getElementById('appointment-reason').value = appointment ? appointment.reason : '';
    document.getElementById('appointment-status').value = appointment ? appointment.status : 'Scheduled';

    document.getElementById('modal-appointment-title').textContent = appointment ? "Edit Appointment" : "Schedule Patient Visit";
    modal.classList.add('open');
  };

  window.editAppointment = function(id) {
    const a = state.appointments.find(x => x.id === Number(id));
    if (a) openAppointmentModal(a);
  };

  window.deleteAppointment = function(id) {
    id = Number(id);
    if (confirm(`Cancel and delete appointment #${id}?`)) {
      state.appointments = state.appointments.filter(x => x.id !== id);
      saveState();
      showToast(`DELETED APPOINTMENT #${id}`);
    }
  };

  // RECORD MODAL
  window.openRecordModal = function(record = null) {
    if (!state.patients.length) {
      showToast("PLEASE REGISTER A PATIENT FIRST BEFORE LOGGING RECORDS");
      openPatientModal();
      return;
    }

    const modal = document.getElementById('modal-record');
    if (!modal) return;
    const patientSelect = document.getElementById('record-patient');

    patientSelect.innerHTML = state.patients.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (#${p.id})</option>`).join('');

    document.getElementById('record-id').value = record ? record.id : '';
    if (record) patientSelect.value = record.patientId;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('record-date').value = record ? record.recordDate : today;
    document.getElementById('record-diagnosis').value = record ? record.diagnosis : '';
    document.getElementById('record-treatment').value = record ? record.treatment : '';
    document.getElementById('record-notes').value = record ? (record.notes || '') : '';

    document.getElementById('modal-record-title').textContent = record ? "Edit Diagnostic Record" : "Add Diagnostic Record";
    modal.classList.add('open');
  };

  window.editRecord = function(id) {
    const r = state.records.find(x => x.id === Number(id));
    if (r) openRecordModal(r);
  };

  window.deleteRecord = function(id) {
    id = Number(id);
    if (confirm(`Permanently delete clinical record #${id}?`)) {
      state.records = state.records.filter(x => x.id !== id);
      saveState();
      showToast(`DELETED RECORD #${id}`);
    }
  };

  window.viewRecord = function(id) {
    id = Number(id);
    const rec = state.records.find(x => x.id === id);
    if (!rec) return;
    const p = getPatient(rec.patientId);
    const container = document.getElementById('record-detail-content');
    if (!container) return;
    container.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">PATIENT</span>
        <span class="detail-value"><strong>${escapeHtml(p.name)}</strong> (#${rec.patientId})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">RECORD DATE</span>
        <span class="detail-value" style="font-family:var(--font-mono); font-size:12px;">${rec.recordDate}</span>
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
        <span class="detail-label">CLINICAL OBSERVATIONS</span>
        <div class="detail-box">${escapeHtml(rec.notes || "No additional observations entered.")}</div>
      </div>
    `;
    document.getElementById('modal-view-record')?.classList.add('open');
  };

  // --- DEMO SEED & PURGE CONTROLS ---
  window.seedDemoData = function() {
    state = JSON.parse(JSON.stringify(DEMO_RECORDS));
    saveState();
    showToast("DEMO RECORDS LOADED SUCCESSFULLY");
  };

  window.purgeAllData = function() {
    if (confirm("WARNING: Clear all hospital records from local database? This resets everything to zero.")) {
      state = JSON.parse(JSON.stringify(DEFAULT_EMPTY));
      saveState();
      showToast("DATABASE PURGED • ALL RECORDS CLEARED");
    }
  };

  // --- FORM SUBMIT HANDLERS ---
  window.handlePatientSubmit = function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('patient-id').value;
    const name = document.getElementById('patient-name').value.trim();
    const age = parseInt(document.getElementById('patient-age').value, 10);
    const gender = document.getElementById('patient-gender').value;
    const phone = document.getElementById('patient-phone').value.trim();
    const bloodGroup = document.getElementById('patient-blood').value;
    const address = document.getElementById('patient-address').value.trim();

    if (!name || isNaN(age) || !phone || !address) {
      showToast("PLEASE FILL IN ALL REQUIRED PATIENT FIELDS");
      return false;
    }

    const data = {
      name,
      age,
      gender,
      phone,
      bloodGroup,
      address,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (id) {
      const idx = state.patients.findIndex(p => p.id === Number(id));
      if (idx !== -1) {
        state.patients[idx] = { ...state.patients[idx], ...data, id: Number(id) };
        showToast(`UPDATED: ${data.name.toUpperCase()}`);
      }
    } else {
      const nextId = state.patients.length ? Math.max(...state.patients.map(p => p.id)) + 1 : 1;
      state.patients.push({ id: nextId, ...data });
      showToast(`REGISTERED: ${data.name.toUpperCase()} (#${nextId})`);
    }

    closeAllModals();
    saveState();
    return false;
  };

  window.handleDoctorSubmit = function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('doctor-id').value;
    const name = document.getElementById('doctor-name').value.trim();
    const specialty = document.getElementById('doctor-specialty').value;
    const phone = document.getElementById('doctor-phone').value.trim();
    const room = document.getElementById('doctor-room').value.trim();

    if (!name || !specialty || !phone || !room) {
      showToast("PLEASE FILL IN ALL REQUIRED DOCTOR FIELDS");
      return false;
    }

    const data = { name, specialty, phone, room };

    if (id) {
      const idx = state.doctors.findIndex(d => d.id === Number(id));
      if (idx !== -1) {
        state.doctors[idx] = { ...state.doctors[idx], ...data, id: Number(id) };
        showToast(`UPDATED: ${data.name.toUpperCase()}`);
      }
    } else {
      const nextId = state.doctors.length ? Math.max(...state.doctors.map(d => d.id)) + 1 : 1;
      state.doctors.push({ id: nextId, ...data });
      showToast(`REGISTERED: ${data.name.toUpperCase()} (#${nextId})`);
    }

    closeAllModals();
    saveState();
    return false;
  };

  window.handleAppointmentSubmit = function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('appointment-id').value;
    const patientId = Number(document.getElementById('appointment-patient').value);
    const doctorId = Number(document.getElementById('appointment-doctor').value);
    const visitDate = document.getElementById('appointment-date').value;
    const visitTime = document.getElementById('appointment-time').value;
    const reason = document.getElementById('appointment-reason').value.trim();
    const status = document.getElementById('appointment-status').value;

    if (!patientId || !doctorId || !visitDate || !visitTime || !reason) {
      showToast("PLEASE COMPLETE ALL APPOINTMENT FIELDS");
      return false;
    }

    const data = { patientId, doctorId, visitDate, visitTime, reason, status };

    if (id) {
      const idx = state.appointments.findIndex(a => a.id === Number(id));
      if (idx !== -1) {
        state.appointments[idx] = { ...state.appointments[idx], ...data, id: Number(id) };
        showToast(`UPDATED: APPOINTMENT #${id}`);
      }
    } else {
      const nextId = state.appointments.length ? Math.max(...state.appointments.map(a => a.id)) + 1 : 1;
      state.appointments.push({ id: nextId, ...data });
      showToast(`BOOKED: APPOINTMENT #${nextId}`);
    }

    closeAllModals();
    saveState();
    return false;
  };

  window.handleRecordSubmit = function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('record-id').value;
    const patientId = Number(document.getElementById('record-patient').value);
    const recordDate = document.getElementById('record-date').value;
    const diagnosis = document.getElementById('record-diagnosis').value.trim();
    const treatment = document.getElementById('record-treatment').value.trim();
    const notes = document.getElementById('record-notes').value.trim();

    if (!patientId || !recordDate || !diagnosis || !treatment) {
      showToast("PLEASE COMPLETE ALL REQUIRED RECORD FIELDS");
      return false;
    }

    const data = { patientId, recordDate, diagnosis, treatment, notes };

    if (id) {
      const idx = state.records.findIndex(r => r.id === Number(id));
      if (idx !== -1) {
        state.records[idx] = { ...state.records[idx], ...data, id: Number(id) };
        showToast(`UPDATED: RECORD #${id}`);
      }
    } else {
      const nextId = state.records.length ? Math.max(...state.records.map(r => r.id)) + 1 : 1;
      state.records.push({ id: nextId, ...data });
      showToast(`LOGGED: RECORD #${nextId}`);
    }

    closeAllModals();
    saveState();
    return false;
  };

  // --- RENDERING PIPELINE ---
  function renderMetrics() {
    const pCount = state.patients.length;
    const dCount = state.doctors.length;
    const aCount = state.appointments.length;
    const rCount = state.records.length;

    const elP = document.getElementById('metric-patients-count');
    const elD = document.getElementById('metric-doctors-count');
    const elA = document.getElementById('metric-appointments-count');
    const elR = document.getElementById('metric-records-count');
    const elSched = document.getElementById('metric-scheduled-sub');

    if (elP) elP.textContent = pCount;
    if (elD) elD.textContent = dCount;
    if (elA) elA.textContent = aCount;
    if (elR) elR.textContent = rCount;

    const scheduled = state.appointments.filter(a => a.status === 'Scheduled').length;
    if (elSched) elSched.textContent = `${scheduled} Scheduled`;
  }

  function renderPatients() {
    const tbody = document.getElementById('tbody-patients');
    const dashTbody = document.getElementById('tbody-dash-patients');
    const query = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    const filtered = state.patients.filter(p => {
      return p.name.toLowerCase().includes(query) ||
             (p.phone && p.phone.toLowerCase().includes(query)) ||
             (p.bloodGroup && p.bloodGroup.toLowerCase().includes(query)) ||
             (p.address && p.address.toLowerCase().includes(query));
    });

    if (dashTbody) {
      if (!state.patients.length) {
        dashTbody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-table-cell">
              <div class="empty-state-box">
                <div class="empty-state-h">No patients registered.</div>
                <div class="empty-state-p">Click "+ Register Patient" on the right or "DEMO" to load data.</div>
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

    if (tbody) {
      if (!filtered.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-table-cell">
              <div class="empty-state-box">
                <div class="empty-state-h">${query ? 'No matching patients found.' : 'No patients registered.'}</div>
                <div class="empty-state-p">${query ? 'Try different search keywords.' : 'Click "+ REGISTER PATIENT" above to add an admission.'}</div>
              </div>
            </td>
          </tr>
        `;
      } else {
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
  }

  function renderDoctors() {
    const tbody = document.getElementById('tbody-doctors');
    if (!tbody) return;
    const query = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    const filtered = state.doctors.filter(d => {
      return d.name.toLowerCase().includes(query) ||
             (d.specialty && d.specialty.toLowerCase().includes(query)) ||
             (d.room && d.room.toLowerCase().includes(query));
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-table-cell">
            <div class="empty-state-box">
              <div class="empty-state-h">${query ? 'No matching doctors found.' : 'No medical staff recorded.'}</div>
              <div class="empty-state-p">${query ? 'Check search spelling.' : 'Click "+ ADD DOCTOR" to record hospital staff.'}</div>
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
    const query = (document.getElementById('global-search')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('filter-appointment-status')?.value || 'ALL';

    const filtered = state.appointments.filter(a => {
      const p = getPatient(a.patientId);
      const d = getDoctor(a.doctorId);
      const matchesQuery = p.name.toLowerCase().includes(query) ||
                           d.name.toLowerCase().includes(query) ||
                           (a.reason && a.reason.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-cell">
            <div class="empty-state-box">
              <div class="empty-state-h">${query ? 'No matching appointments found.' : 'No appointments scheduled.'}</div>
              <div class="empty-state-p">${query ? 'Adjust search or status filter.' : 'Click "+ SCHEDULE VISIT" above to book a consultation.'}</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(a => {
      const p = getPatient(a.patientId);
      const d = getDoctor(a.doctorId);
      const statusClass = (a.status || 'scheduled').toLowerCase();
      return `
        <tr>
          <td class="td-mono">#${a.id}</td>
          <td class="td-bold">${escapeHtml(p.name)}</td>
          <td>${escapeHtml(d.name)}</td>
          <td style="font-family:var(--font-mono); font-size:12px;">${a.visitDate} @ ${a.visitTime}</td>
          <td>${escapeHtml(a.reason)}</td>
          <td><span class="badge-status ${statusClass}">${escapeHtml(a.status)}</span></td>
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
    const query = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    const filtered = state.records.filter(r => {
      const p = getPatient(r.patientId);
      return p.name.toLowerCase().includes(query) ||
             (r.diagnosis && r.diagnosis.toLowerCase().includes(query)) ||
             (r.treatment && r.treatment.toLowerCase().includes(query)) ||
             (r.notes && r.notes.toLowerCase().includes(query));
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-cell">
            <div class="empty-state-box">
              <div class="empty-state-h">${query ? 'No matching clinical records found.' : 'No clinical records logged.'}</div>
              <div class="empty-state-p">${query ? 'Try different keywords.' : 'Click "+ ADD RECORD" to document patient diagnoses.'}</div>
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
            <button class="btn-action-icon" onclick="editRecord(${r.id})" title="Edit Record">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="btn-action-icon danger" onclick="deleteRecord(${r.id})" title="Delete Record">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderTodaySchedule() {
    const container = document.getElementById('today-schedule-body');
    if (!container) return;

    if (!state.appointments.length) {
      container.innerHTML = `
        <div class="empty-tray">
          <div class="empty-tray-title">Your schedule is empty.</div>
          <div class="empty-tray-desc">Book consultations from appointments tab to track today's rounds.</div>
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

  function renderApp() {
    renderMetrics();
    renderPatients();
    renderDoctors();
    renderAppointments();
    renderRecords();
    renderTodaySchedule();
  }
  window.renderApp = renderApp;

  // --- EVENT LISTENERS INITIALIZATION ---
  function initListeners() {
    // Backdrop click closes modal
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
    });

    // Close on ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });

    // Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Search and filters
    document.getElementById('global-search')?.addEventListener('input', () => renderApp());
    document.getElementById('filter-appointment-status')?.addEventListener('change', () => renderAppointments());

    // Navigation and pills
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.querySelectorAll('[data-goto]').forEach(card => {
      card.addEventListener('click', () => switchView(card.dataset.goto));
    });
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => filterByTab(pill.dataset.filter));
    });

    // Quick Actions
    document.getElementById('qa-patient')?.addEventListener('click', () => openPatientModal());
    document.getElementById('qa-doctor')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('qa-appointment')?.addEventListener('click', () => openAppointmentModal());
    document.getElementById('qa-record')?.addEventListener('click', () => openRecordModal());

    // Panel Add buttons
    document.getElementById('btn-open-patient-modal')?.addEventListener('click', () => openPatientModal());
    document.getElementById('btn-open-doctor-modal')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('btn-open-appointment-modal')?.addEventListener('click', () => openAppointmentModal());
    document.getElementById('btn-open-record-modal')?.addEventListener('click', () => openRecordModal());
    document.getElementById('link-goto-patients')?.addEventListener('click', () => switchView('patients'));

    // Purge & Seed
    document.getElementById('btn-purge-data')?.addEventListener('click', purgeAllData);
    document.getElementById('btn-seed-data')?.addEventListener('click', seedDemoData);

    // Form Submissions
    document.getElementById('form-patient')?.addEventListener('submit', handlePatientSubmit);
    document.getElementById('form-doctor')?.addEventListener('submit', handleDoctorSubmit);
    document.getElementById('form-appointment')?.addEventListener('submit', handleAppointmentSubmit);
    document.getElementById('form-record')?.addEventListener('submit', handleRecordSubmit);
  }

  // --- BOOTSTRAP ---
  function init() {
    initListeners();
    renderApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
