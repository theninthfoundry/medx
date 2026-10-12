/**
 * MEDX — Hospital Records & Clinical Management System
 * Client-side Reactive Architecture with LocalStorage Persistence
 */

(function () {
  'use strict';

  // --- SEED DATA ---
  const DEFAULT_SEED_DATA = {
    patients: [
      { id: 1, name: "Marcus Blackwell", age: 48, gender: "Male", phone: "+1 (555) 234-8901", bloodGroup: "O+", address: "742 Evergreen Terrace, West Wing", createdAt: "2026-09-12" },
      { id: 2, name: "Elena Rostova", age: 34, gender: "Female", phone: "+1 (555) 412-9903", bloodGroup: "A-", address: "14B Kestrel Boulevard, North Ward", createdAt: "2026-09-18" },
      { id: 3, name: "David Sterling", age: 62, gender: "Male", phone: "+1 (555) 872-3104", bloodGroup: "B+", address: "89 St. Jude Crescent, Suite 4A", createdAt: "2026-09-25" },
      { id: 4, name: "Aria Thorne", age: 29, gender: "Female", phone: "+1 (555) 604-5120", bloodGroup: "AB+", address: "205 Pine Ridge Lane", createdAt: "2026-10-01" },
      { id: 5, name: "Samuel Vance", age: 53, gender: "Male", phone: "+1 (555) 791-0024", bloodGroup: "O-", address: "11 Harbor View Drive", createdAt: "2026-10-05" }
    ],
    doctors: [
      { id: 1, name: "Dr. Eleanor Vance, MD", specialty: "Cardiology", phone: "+1 (555) 019-3321", room: "Suite 401, East Wing" },
      { id: 2, name: "Dr. Jonathan Reyes, MD", specialty: "Neurology", phone: "+1 (555) 019-8832", room: "Clinic 204, Tower B" },
      { id: 3, name: "Dr. Sarah Chen, MD", specialty: "Pediatrics", phone: "+1 (555) 019-5510", room: "Pediatrics Center, 1st Fl" },
      { id: 4, name: "Dr. Arthur Pendelton, DO", specialty: "Orthopedics", phone: "+1 (555) 019-7744", room: "Surgical Suite 3B" },
      { id: 5, name: "Dr. Maya Patel, MD", specialty: "Oncology", phone: "+1 (555) 019-2180", room: "Pavilion Suite 510" }
    ],
    appointments: [
      { id: 1, patientId: 1, doctorId: 1, visitDate: "2026-10-14", visitTime: "09:30", reason: "Follow-up ECG & hypertension assessment", status: "Scheduled" },
      { id: 2, patientId: 2, doctorId: 2, visitDate: "2026-10-14", visitTime: "11:00", reason: "Migraine assessment & MRI review", status: "Scheduled" },
      { id: 3, patientId: 3, doctorId: 4, visitDate: "2026-10-13", visitTime: "14:15", reason: "Right knee arthroscopy post-op check", status: "Completed" },
      { id: 4, patientId: 4, doctorId: 3, visitDate: "2026-10-15", visitTime: "10:00", reason: "Routine wellness consultation", status: "Scheduled" }
    ],
    records: [
      { id: 1, patientId: 1, recordDate: "2026-09-20", diagnosis: "Essential Stage 1 Hypertension", treatment: "Amlodipine 5mg once daily; low-sodium diet; weekly BP tracking", notes: "Patient reported mild morning fatigue. Rest ECG shows normal sinus rhythm. Follow-up in 4 weeks." },
      { id: 2, patientId: 3, recordDate: "2026-08-15", diagnosis: "Grade III Meniscal Tear (Right Knee)", treatment: "Arthroscopic partial meniscectomy performed; physiotherapy twice weekly", notes: "Surgical procedure successful without complications. Full weight bearing in 3 weeks." },
      { id: 3, patientId: 2, recordDate: "2026-10-02", diagnosis: "Chronic Migraine with Visual Aura", treatment: "Sumatriptan 50mg PRN at onset; Topiramate 25mg daily prophylaxis", notes: "Triggers identified: stress and sleep disruption. Sleep hygiene protocol advised." }
    ]
  };

  // --- APPLICATION STATE ---
  const STORAGE_KEY = 'medx_hospital_records_v1';
  let state = loadState();

  function loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
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
    return state.patients.find(p => p.id === Number(id)) || { name: "Unknown Patient" };
  }
  function getDoctor(id) {
    return state.doctors.find(d => d.id === Number(id)) || { name: "Unknown Doctor" };
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠';

    toast.innerHTML = `<span style="font-weight:700;">${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
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
  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        switchView(targetView);
      });
    });

    const btnGoAppointments = document.getElementById('btn-goto-appointments');
    if (btnGoAppointments) {
      btnGoAppointments.addEventListener('click', () => switchView('appointments'));
    }

    // Quick Actions on Dashboard
    document.getElementById('qa-add-patient')?.addEventListener('click', () => openPatientModal());
    document.getElementById('qa-add-doctor')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('qa-add-appointment')?.addEventListener('click', () => openAppointmentModal());
    document.getElementById('qa-add-record')?.addEventListener('click', () => openRecordModal());
  }

  function switchView(viewName) {
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- CLOCK & TIMERS ---
  function initClock() {
    const clockEl = document.getElementById('clock-display');
    function tick() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      if (clockEl) clockEl.textContent = `${dateStr} • ${timeStr}`;
    }
    tick();
    setInterval(tick, 1000);
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

    // Trigger buttons
    document.getElementById('btn-open-patient-modal')?.addEventListener('click', () => openPatientModal());
    document.getElementById('btn-open-doctor-modal')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('btn-open-appointment-modal')?.addEventListener('click', () => openAppointmentModal());
    document.getElementById('btn-open-record-modal')?.addEventListener('click', () => openRecordModal());

    // Reset Sample Data Button
    document.getElementById('btn-seed-data')?.addEventListener('click', () => {
      if (confirm("Reset hospital database to default sample records? Current modifications will be refreshed.")) {
        state = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
        saveState();
        showToast("Database restored to default sample records", "success");
      }
    });

    // Forms
    setupPatientForm();
    setupDoctorForm();
    setupAppointmentForm();
    setupRecordForm();
  }

  // --- PATIENTS ---
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
    title.textContent = patient ? "Edit Patient Details" : "Register New Patient";
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
          showToast(`Updated record for ${patientData.name}`, "success");
        }
      } else {
        const newId = state.patients.length ? Math.max(...state.patients.map(p => p.id)) + 1 : 1;
        state.patients.push({ id: newId, ...patientData });
        showToast(`Patient ${patientData.name} successfully registered`, "success");
      }

      document.getElementById('modal-patient').classList.remove('open');
      saveState();
    });
  }

  window.deletePatient = function(id) {
    const patient = getPatient(id);
    if (confirm(`Are you sure you want to delete patient "${patient.name}"? This will also remove associated appointments and records.`)) {
      state.patients = state.patients.filter(p => p.id !== id);
      state.appointments = state.appointments.filter(a => a.patientId !== id);
      state.records = state.records.filter(r => r.patientId !== id);
      saveState();
      showToast(`Removed patient ${patient.name}`, "info");
    }
  };

  window.editPatient = function(id) {
    const p = state.patients.find(x => x.id === id);
    if (p) openPatientModal(p);
  };

  // --- DOCTORS ---
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
          showToast(`Updated physician profile for ${doctorData.name}`, "success");
        }
      } else {
        const newId = state.doctors.length ? Math.max(...state.doctors.map(d => d.id)) + 1 : 1;
        state.doctors.push({ id: newId, ...doctorData });
        showToast(`Registered physician ${doctorData.name}`, "success");
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
      showToast(`Removed physician ${doc.name}`, "info");
    }
  };

  window.editDoctor = function(id) {
    const d = state.doctors.find(x => x.id === id);
    if (d) openDoctorModal(d);
  };

  // --- APPOINTMENTS ---
  function openAppointmentModal(appointment = null) {
    const modal = document.getElementById('modal-appointment');
    const title = document.getElementById('modal-appointment-title');
    const patientSelect = document.getElementById('appointment-patient');
    const doctorSelect = document.getElementById('appointment-doctor');

    // Populate selects
    patientSelect.innerHTML = state.patients.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (ID: ${p.id})</option>`).join('');
    doctorSelect.innerHTML = state.doctors.map(d => `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.specialty)}</option>`).join('');

    if (!state.patients.length || !state.doctors.length) {
      showToast("Please register at least one patient and one doctor first", "error");
      return;
    }

    document.getElementById('appointment-id').value = appointment ? appointment.id : '';
    if (appointment) patientSelect.value = appointment.patientId;
    if (appointment) doctorSelect.value = appointment.doctorId;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = appointment ? appointment.visitDate : today;
    document.getElementById('appointment-time').value = appointment ? appointment.visitTime : '10:00';
    document.getElementById('appointment-reason').value = appointment ? appointment.reason : '';
    document.getElementById('appointment-status').value = appointment ? appointment.status : 'Scheduled';

    title.textContent = appointment ? "Modify Appointment" : "Schedule Patient Visit";
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
          showToast("Appointment schedule updated", "success");
        }
      } else {
        const newId = state.appointments.length ? Math.max(...state.appointments.map(a => a.id)) + 1 : 1;
        state.appointments.push({ id: newId, ...apptData });
        showToast("Consultation visit booked successfully", "success");
      }

      document.getElementById('modal-appointment').classList.remove('open');
      saveState();
    });
  }

  window.deleteAppointment = function(id) {
    if (confirm("Cancel and delete this appointment schedule?")) {
      state.appointments = state.appointments.filter(a => a.id !== id);
      saveState();
      showToast("Appointment removed", "info");
    }
  };

  window.editAppointment = function(id) {
    const a = state.appointments.find(x => x.id === id);
    if (a) openAppointmentModal(a);
  };

  // --- MEDICAL RECORDS ---
  function openRecordModal(record = null) {
    const modal = document.getElementById('modal-record');
    const title = document.getElementById('modal-record-title');
    const patientSelect = document.getElementById('record-patient');

    patientSelect.innerHTML = state.patients.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (ID: ${p.id})</option>`).join('');

    if (!state.patients.length) {
      showToast("Please register a patient first", "error");
      return;
    }

    document.getElementById('record-id').value = record ? record.id : '';
    if (record) patientSelect.value = record.patientId;
    document.getElementById('record-date').value = record ? record.recordDate : new Date().toISOString().split('T')[0];
    document.getElementById('record-diagnosis').value = record ? record.diagnosis : '';
    document.getElementById('record-treatment').value = record ? record.treatment : '';
    document.getElementById('record-notes').value = record ? record.notes : '';

    title.textContent = record ? "Edit Clinical Record" : "Add Clinical Record";
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
          showToast("Clinical record updated", "success");
        }
      } else {
        const newId = state.records.length ? Math.max(...state.records.map(r => r.id)) + 1 : 1;
        state.records.push({ id: newId, ...recData });
        showToast("Clinical record logged in archive", "success");
      }

      document.getElementById('modal-record').classList.remove('open');
      saveState();
    });
  }

  window.deleteRecord = function(id) {
    if (confirm("Permanently delete this clinical case record?")) {
      state.records = state.records.filter(r => r.id !== id);
      saveState();
      showToast("Clinical record deleted", "info");
    }
  };

  window.viewRecord = function(id) {
    const rec = state.records.find(r => r.id === id);
    if (!rec) return;
    const patient = getPatient(rec.patientId);
    const content = document.getElementById('record-detail-content');
    content.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Patient Name & ID</span>
        <span class="detail-value"><strong>${escapeHtml(patient.name)}</strong> (PID: ${rec.patientId})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Entry Date</span>
        <span class="detail-value">${rec.recordDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Primary Diagnosis</span>
        <span class="detail-value" style="color:#f43f5e; font-weight:700;">${escapeHtml(rec.diagnosis)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Treatment & Prescriptions</span>
        <div class="detail-box">${escapeHtml(rec.treatment)}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Physician Notes & Observations</span>
        <div class="detail-box">${escapeHtml(rec.notes || "No notes logged.")}</div>
      </div>
    `;
    document.getElementById('modal-view-record').classList.add('open');
  };

  // --- SEARCH FILTERS ---
  function setupSearchFilters() {
    document.getElementById('search-patients')?.addEventListener('input', renderPatients);
    document.getElementById('search-doctors')?.addEventListener('input', renderDoctors);
    document.getElementById('search-appointments')?.addEventListener('input', renderAppointments);
    document.getElementById('filter-appointment-status')?.addEventListener('change', renderAppointments);
    document.getElementById('search-records')?.addEventListener('input', renderRecords);
  }

  // --- RENDER FUNCTIONS ---
  function renderApp() {
    renderBadgesAndMetrics();
    renderPatients();
    renderDoctors();
    renderAppointments();
    renderRecords();
    renderDashboardWidgets();
  }

  function renderBadgesAndMetrics() {
    const pCount = state.patients.length;
    const dCount = state.doctors.length;
    const aCount = state.appointments.length;
    const rCount = state.records.length;

    // Badges in sidebar
    document.getElementById('badge-patients').textContent = pCount;
    document.getElementById('badge-doctors').textContent = dCount;
    document.getElementById('badge-appointments').textContent = aCount;
    document.getElementById('badge-records').textContent = rCount;

    // Dashboard Cards
    document.getElementById('metric-patients-count').textContent = pCount;
    document.getElementById('metric-doctors-count').textContent = dCount;
    document.getElementById('metric-appointments-count').textContent = aCount;
    document.getElementById('metric-records-count').textContent = rCount;

    const scheduled = state.appointments.filter(a => a.status === 'Scheduled').length;
    document.getElementById('metric-scheduled-sub').textContent = `${scheduled} Scheduled`;
  }

  function renderPatients() {
    const tbody = document.getElementById('tbody-patients');
    if (!tbody) return;
    const query = (document.getElementById('search-patients')?.value || '').toLowerCase();

    const filtered = state.patients.filter(p => {
      return p.name.toLowerCase().includes(query) ||
             p.phone.toLowerCase().includes(query) ||
             p.bloodGroup.toLowerCase().includes(query) ||
             p.address.toLowerCase().includes(query);
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">No patients found matching search criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td class="cell-id">#${p.id}</td>
        <td class="cell-bold">${escapeHtml(p.name)}</td>
        <td>${p.age} yrs • ${escapeHtml(p.gender)}</td>
        <td>${escapeHtml(p.phone)}</td>
        <td><span class="badge-blood">${p.bloodGroup}</span></td>
        <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(p.address)}</td>
        <td class="text-right">
          <div class="cell-actions">
            <button class="btn-icon" onclick="editPatient(${p.id})" title="Edit Patient">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="btn-icon danger" onclick="deletePatient(${p.id})" title="Delete Patient">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderDoctors() {
    const tbody = document.getElementById('tbody-doctors');
    if (!tbody) return;
    const query = (document.getElementById('search-doctors')?.value || '').toLowerCase();

    const filtered = state.doctors.filter(d => {
      return d.name.toLowerCase().includes(query) ||
             d.specialty.toLowerCase().includes(query) ||
             d.room.toLowerCase().includes(query);
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">No medical staff found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td class="cell-id">#${d.id}</td>
        <td class="cell-bold">${escapeHtml(d.name)}</td>
        <td><span class="badge-specialty">${escapeHtml(d.specialty)}</span></td>
        <td>${escapeHtml(d.phone)}</td>
        <td>${escapeHtml(d.room)}</td>
        <td class="text-right">
          <div class="cell-actions">
            <button class="btn-icon" onclick="editDoctor(${d.id})" title="Edit Doctor">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="btn-icon danger" onclick="deleteDoctor(${d.id})" title="Delete Doctor">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderAppointments() {
    const tbody = document.getElementById('tbody-appointments');
    if (!tbody) return;
    const query = (document.getElementById('search-appointments')?.value || '').toLowerCase();
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
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">No appointments found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(a => {
      const p = getPatient(a.patientId);
      const d = getDoctor(a.doctorId);
      const statusClass = a.status.toLowerCase();
      return `
        <tr>
          <td class="cell-id">#${a.id}</td>
          <td class="cell-bold">${escapeHtml(p.name)}</td>
          <td>${escapeHtml(d.name)}</td>
          <td>${a.visitDate} <span style="color:var(--text-muted); font-size:11px;">@ ${a.visitTime}</span></td>
          <td>${escapeHtml(a.reason)}</td>
          <td><span class="badge-status ${statusClass}">${a.status}</span></td>
          <td class="text-right">
            <div class="cell-actions">
              <button class="btn-icon" onclick="editAppointment(${a.id})" title="Edit Appointment">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
              <button class="btn-icon danger" onclick="deleteAppointment(${a.id})" title="Cancel Appointment">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderRecords() {
    const tbody = document.getElementById('tbody-records');
    if (!tbody) return;
    const query = (document.getElementById('search-records')?.value || '').toLowerCase();

    const filtered = state.records.filter(r => {
      const p = getPatient(r.patientId);
      return p.name.toLowerCase().includes(query) ||
             r.diagnosis.toLowerCase().includes(query) ||
             r.treatment.toLowerCase().includes(query) ||
             r.notes.toLowerCase().includes(query);
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">No clinical records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const p = getPatient(r.patientId);
      return `
        <tr>
          <td class="cell-id">#${r.id}</td>
          <td class="cell-bold">${escapeHtml(p.name)}</td>
          <td>${r.recordDate}</td>
          <td style="color:#f87171; font-weight:600;">${escapeHtml(r.diagnosis)}</td>
          <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(r.treatment)}</td>
          <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-muted);">${escapeHtml(r.notes || "—")}</td>
          <td class="text-right">
            <div class="cell-actions">
              <button class="btn-icon" onclick="viewRecord(${r.id})" title="View Details">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="btn-icon danger" onclick="deleteRecord(${r.id})" title="Delete Record">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderDashboardWidgets() {
    const list = document.getElementById('dashboard-appointments-list');
    if (!list) return;

    const upcoming = state.appointments.slice(0, 4);
    if (!upcoming.length) {
      list.innerHTML = `<div style="color:var(--text-muted); font-size:12px; padding:12px;">No visits scheduled.</div>`;
      return;
    }

    list.innerHTML = upcoming.map(a => {
      const p = getPatient(a.patientId);
      const d = getDoctor(a.doctorId);
      return `
        <div class="widget-item">
          <div class="widget-item-left">
            <span class="widget-patient">${escapeHtml(p.name)}</span>
            <span class="widget-doctor">with ${escapeHtml(d.name)} (${escapeHtml(a.reason)})</span>
          </div>
          <span class="widget-time">${a.visitDate} @ ${a.visitTime}</span>
        </div>
      `;
    }).join('');
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initClock();
    setupNavigation();
    setupModals();
    setupSearchFilters();
    renderApp();
  });

})();
