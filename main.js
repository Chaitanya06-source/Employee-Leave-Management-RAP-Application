import { LeaveMgmtStore } from './data.js';
import { abapCodeSnippets } from './abapCode.js';

// Initialize Data Store
const store = new LeaveMgmtStore();

// Application DOM Elements
const elements = {
  // Tabs
  navTabs: document.querySelectorAll('.nav-tab'),
  tabViews: document.querySelectorAll('.tab-view'),
  
  // KPIs
  kpiVacation: document.getElementById('kpi-vacation-remaining'),
  kpiPending: document.getElementById('kpi-pending-count'),
  kpiApproved: document.getElementById('kpi-approved-count'),
  kpiRejected: document.getElementById('kpi-rejected-count'),
  deskBadge: document.getElementById('desk-pending-badge'),

  // Filters
  filterSearch: document.getElementById('filter-search'),
  filterStatus: document.getElementById('filter-status'),
  filterLeaveType: document.getElementById('filter-leavetype'),
  btnGoSearch: document.getElementById('btn-go-search'),
  btnClearFilters: document.getElementById('btn-clear-filters'),

  // Table
  tableBody: document.getElementById('requests-table-body'),
  tableCount: document.getElementById('table-count'),
  btnNewLeaveReq: document.getElementById('btn-new-leave-req'),
  btnRunUnitQuick: document.getElementById('btn-run-unit-tests-quick'),

  // Form
  form: document.getElementById('leave-form'),
  leaveTypeSelect: document.getElementById('form-leave-type'),
  startDateInput: document.getElementById('form-start-date'),
  endDateInput: document.getElementById('form-end-date'),
  calcDaysVal: document.getElementById('calc-days-val'),
  reasonInput: document.getElementById('form-reason'),
  validationAlert: document.getElementById('form-validation-alert'),
  validationErrorList: document.getElementById('validation-error-list'),
  btnCancelLeave: document.getElementById('btn-cancel-leave'),

  // Manager Desk
  managerPendingList: document.getElementById('manager-pending-list'),

  // Balances
  balanceCardsWrapper: document.getElementById('balance-cards-wrapper'),

  // ABAP Unit Tests
  btnRunAllUnitTests: document.getElementById('btn-run-all-unit-tests'),
  unitPassedCount: document.getElementById('unit-passed-count'),
  unitFailedCount: document.getElementById('unit-failed-count'),
  unitTimeCount: document.getElementById('unit-time-count'),
  unitTestList: document.getElementById('unit-test-list'),

  // Code Inspector
  codeTabs: document.querySelectorAll('.code-tab'),
  codeViewerTitle: document.getElementById('code-viewer-title'),
  codeViewerType: document.getElementById('code-viewer-type'),
  codeViewerContent: document.getElementById('code-viewer-content'),

  // Modals
  modalObjectPage: document.getElementById('modal-object-page'),
  btnCloseObjModal: document.getElementById('btn-close-obj-modal'),
  objReqId: document.getElementById('obj-req-id'),
  objEmpName: document.getElementById('obj-emp-name'),
  objStatusBadge: document.getElementById('obj-status-badge'),
  objLeaveType: document.getElementById('obj-leave-type'),
  objDuration: document.getElementById('obj-duration'),
  objDateRange: document.getElementById('obj-date-range'),
  objDept: document.getElementById('obj-dept'),
  objManager: document.getElementById('obj-manager'),
  objReason: document.getElementById('obj-reason'),
  objRejectionContainer: document.getElementById('obj-rejection-container'),
  objRejectionReason: document.getElementById('obj-rejection-reason'),
  objTimeline: document.getElementById('obj-timeline'),
  objModalActions: document.getElementById('obj-modal-actions'),

  // Reject Modal
  modalRejectDialog: document.getElementById('modal-reject-dialog'),
  btnCloseRejectModal: document.getElementById('btn-close-reject-modal'),
  btnCancelReject: document.getElementById('btn-cancel-reject'),
  btnConfirmReject: document.getElementById('btn-confirm-reject'),
  rejectReqId: document.getElementById('reject-req-id'),
  rejectReasonInput: document.getElementById('reject-reason-input'),

  // Controls
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  btnResetData: document.getElementById('btn-reset-data')
};

// Global App State
let activeRejectUuid = null;

// ==========================================================================
// Initialization
// ==========================================================================
function init() {
  bindEvents();
  renderAllViews();
  loadCodeSnippet('cds_interface');
  
  // Set default form dates to next week
  const today = new Date('2026-09-24');
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7 || 7);
  const nextFriday = new Date(nextMonday);
  nextFriday.setDate(nextMonday.getDate() + 4);

  elements.startDateInput.value = nextMonday.toISOString().split('T')[0];
  elements.endDateInput.value = nextFriday.toISOString().split('T')[0];
  updateCalculatedDays();
}

// ==========================================================================
// Event Bindings
// ==========================================================================
function bindEvents() {
  // Navigation Tabs
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.navTabs.forEach(t => t.classList.remove('active'));
      elements.tabViews.forEach(v => v.classList.remove('active'));
      
      tab.classList.add('active');
      const targetView = document.getElementById(`view-${tab.dataset.tab}`);
      if (targetView) targetView.classList.add('active');
    });
  });

  // Theme Toggle
  elements.btnThemeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    elements.btnThemeToggle.innerHTML = isDark ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
  });

  // Reset Data
  elements.btnResetData.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data to initial SAP demo state?')) {
      store.resetDemoData();
      renderAllViews();
    }
  });

  // Filters
  elements.btnGoSearch.addEventListener('click', renderTable);
  elements.filterSearch.addEventListener('keyup', (e) => { if (e.key === 'Enter') renderTable(); });
  elements.filterStatus.addEventListener('change', renderTable);
  elements.filterLeaveType.addEventListener('change', renderTable);
  elements.btnClearFilters.addEventListener('click', () => {
    elements.filterSearch.value = '';
    elements.filterStatus.value = 'ALL';
    elements.filterLeaveType.value = 'ALL';
    renderTable();
  });

  // Quick Action Buttons
  elements.btnNewLeaveReq.addEventListener('click', () => {
    switchTab('apply-leave');
  });

  elements.btnRunUnitQuick.addEventListener('click', () => {
    switchTab('abap-unit');
    runABAPUnitTestSuite();
  });

  // Form Live Duration
  elements.startDateInput.addEventListener('change', updateCalculatedDays);
  elements.endDateInput.addEventListener('change', updateCalculatedDays);
  elements.leaveTypeSelect.addEventListener('change', updateCalculatedDays);

  // Form Submit
  elements.form.addEventListener('submit', handleFormSubmit);
  elements.btnCancelLeave.addEventListener('click', () => switchTab('list-report'));

  // Object Page Modal Close
  elements.btnCloseObjModal.addEventListener('click', closeObjectModal);

  // Reject Modal Controls
  elements.btnCloseRejectModal.addEventListener('click', closeRejectModal);
  elements.btnCancelReject.addEventListener('click', closeRejectModal);
  elements.btnConfirmReject.addEventListener('click', handleConfirmReject);

  // ABAP Unit Suite Execution
  elements.btnRunAllUnitTests.addEventListener('click', runABAPUnitTestSuite);

  // Code Inspector Switcher
  elements.codeTabs.forEach(ctab => {
    ctab.addEventListener('click', () => {
      elements.codeTabs.forEach(t => t.classList.remove('active'));
      ctab.classList.add('active');
      loadCodeSnippet(ctab.dataset.snippet);
    });
  });
}

function switchTab(tabId) {
  const targetNavBtn = Array.from(elements.navTabs).find(t => t.dataset.tab === tabId);
  if (targetNavBtn) targetNavBtn.click();
}

// ==========================================================================
// Render Views & KPIs
// ==========================================================================
function renderAllViews() {
  renderKPIs();
  renderTable();
  renderManagerDesk();
  renderBalances();
  renderInitialUnitTestState();
}

function renderKPIs() {
  const requests = store.getRequests();
  const balances = store.getBalance('EMP1001');

  const vacObj = balances.find(b => b.leaveType === 'VACATION');
  elements.kpiVacation.textContent = vacObj ? vacObj.remaining : 0;

  const pending = requests.filter(r => r.status === 'P').length;
  const approved = requests.filter(r => r.status === 'A').length;
  const rejected = requests.filter(r => r.status === 'R').length;

  elements.kpiPending.textContent = pending;
  elements.kpiApproved.textContent = approved;
  elements.kpiRejected.textContent = rejected;

  elements.deskBadge.textContent = pending;
}

// ==========================================================================
// List Report Table Rendering
// ==========================================================================
function renderTable() {
  let requests = store.getRequests();

  const search = elements.filterSearch.value.trim().toLowerCase();
  const statusFilter = elements.filterStatus.value;
  const leaveTypeFilter = elements.filterLeaveType.value;

  if (search) {
    requests = requests.filter(r => 
      r.reqId.toLowerCase().includes(search) ||
      r.empName.toLowerCase().includes(search) ||
      r.empId.toLowerCase().includes(search) ||
      r.reason.toLowerCase().includes(search)
    );
  }

  if (statusFilter !== 'ALL') {
    requests = requests.filter(r => r.status === statusFilter);
  }

  if (leaveTypeFilter !== 'ALL') {
    requests = requests.filter(r => r.leaveType === leaveTypeFilter);
  }

  elements.tableCount.textContent = `(${requests.length})`;

  if (requests.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">
          <i class="ri-inbox-line" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
          No leave requests match the specified filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = requests.map(req => {
    const statusChip = getStatusChipHTML(req.status);
    return `
      <tr data-uuid="${req.uuid}">
        <td><strong>${req.reqId}</strong></td>
        <td>
          <div style="font-weight: 600;">${req.empName}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${req.empId}</div>
        </td>
        <td><span class="sap-tag">${req.leaveType}</span></td>
        <td>${req.startDate}</td>
        <td>${req.endDate}</td>
        <td><strong>${req.totalDays}</strong></td>
        <td>${statusChip}</td>
        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${req.reason}">
          ${req.reason}
        </td>
        <td class="text-right" onclick="event.stopPropagation();">
          <div class="table-actions">
            <button class="fiori-btn text-btn btn-view-obj" data-uuid="${req.uuid}">View</button>
            ${req.status === 'P' ? `
              <button class="fiori-btn primary-btn btn-approve-inline" data-uuid="${req.uuid}" style="padding: 4px 10px; font-size: 0.75rem;">Approve</button>
              <button class="fiori-btn danger-btn btn-reject-inline" data-uuid="${req.uuid}" style="padding: 4px 10px; font-size: 0.75rem;">Reject</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Row Click for Object Page Modal
  elements.tableBody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const uuid = tr.dataset.uuid;
      if (uuid) openObjectModal(uuid);
    });
  });

  // Action Buttons inside table
  elements.tableBody.querySelectorAll('.btn-view-obj').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openObjectModal(btn.dataset.uuid);
    });
  });

  elements.tableBody.querySelectorAll('.btn-approve-inline').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (store.approveRequest(btn.dataset.uuid)) {
        renderAllViews();
      }
    });
  });

  elements.tableBody.querySelectorAll('.btn-reject-inline').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openRejectModal(btn.dataset.uuid);
    });
  });
}

function getStatusChipHTML(status) {
  switch (status) {
    case 'A': return `<span class="status-chip approved"><i class="ri-checkbox-circle-fill"></i> Approved</span>`;
    case 'R': return `<span class="status-chip rejected"><i class="ri-close-circle-fill"></i> Rejected</span>`;
    case 'P':
    default: return `<span class="status-chip pending"><i class="ri-time-fill"></i> Pending</span>`;
  }
}

// ==========================================================================
// Apply Form Validation & Calculations
// ==========================================================================
function updateCalculatedDays() {
  const empId = 'EMP1001';
  const leaveType = elements.leaveTypeSelect.value;
  const start = elements.startDateInput.value;
  const end = elements.endDateInput.value;

  const result = store.validateLeaveRequest(empId, leaveType, start, end);

  if (result.valid) {
    elements.calcDaysVal.textContent = `${result.totalDays} Working Day${result.totalDays > 1 ? 's' : ''}`;
    elements.calcDaysVal.style.color = 'var(--text-primary)';
    elements.validationAlert.classList.add('hidden');
  } else {
    elements.calcDaysVal.textContent = `Invalid Request (${result.totalDays} Days Calculated)`;
    elements.calcDaysVal.style.color = 'var(--fiori-red)';
    elements.validationErrorList.innerHTML = result.errors.map(err => `<li>${err}</li>`).join('');
    elements.validationAlert.classList.remove('hidden');
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const empId = 'EMP1001';
  const empName = 'Sarah Jenkins';
  const leaveType = elements.leaveTypeSelect.value;
  const startDate = elements.startDateInput.value;
  const endDate = elements.endDateInput.value;
  const reason = elements.reasonInput.value.trim();

  try {
    const newReq = store.createRequest({
      empId,
      empName,
      leaveType,
      startDate,
      endDate,
      reason
    });

    renderAllViews();
    switchTab('list-report');
    alert(`Leave Request ${newReq.reqId} submitted successfully via RAP Transactional Buffer! Status set to PENDING approval.`);
  } catch (err) {
    alert(`RAP Validation Exception:\n${err.message}`);
  }
}

// ==========================================================================
// Manager Approval Desk
// ==========================================================================
function renderManagerDesk() {
  const pendingRequests = store.getRequests().filter(r => r.status === 'P');

  if (pendingRequests.length === 0) {
    elements.managerPendingList.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
        <i class="ri-checkbox-circle-line" style="font-size: 3rem; color: var(--fiori-green); display: block; margin-bottom: 12px;"></i>
        <h3>All Pending Requests Cleaned</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem;">There are currently no leave requests awaiting manager action.</p>
      </div>
    `;
    return;
  }

  elements.managerPendingList.innerHTML = pendingRequests.map(req => `
    <div class="manager-card">
      <div>
        <div class="manager-card-header">
          <div>
            <div class="emp-name-title">${req.empName}</div>
            <div class="emp-dept">${req.empId} • ${req.deptId}</div>
          </div>
          <span class="sap-tag" style="background: var(--fiori-blue-light); color: var(--fiori-blue); font-weight: 700;">${req.reqId}</span>
        </div>
        <div class="manager-card-details">
          <div class="detail-row">
            <span>Category:</span> <strong>${req.leaveType}</strong>
          </div>
          <div class="detail-row">
            <span>Duration:</span> <strong>${req.totalDays} Days</strong>
          </div>
          <div class="detail-row">
            <span>Dates:</span> <strong>${req.startDate} to ${req.endDate}</strong>
          </div>
        </div>
        <div class="manager-reason-box">
          "${req.reason}"
        </div>
      </div>
      <div class="manager-card-actions">
        <button class="fiori-btn primary-btn btn-desk-approve" data-uuid="${req.uuid}">
          <i class="ri-check-line"></i> Approve
        </button>
        <button class="fiori-btn danger-btn btn-desk-reject" data-uuid="${req.uuid}">
          <i class="ri-close-line"></i> Reject
        </button>
      </div>
    </div>
  `).join('');

  elements.managerPendingList.querySelectorAll('.btn-desk-approve').forEach(btn => {
    btn.addEventListener('click', () => {
      if (store.approveRequest(btn.dataset.uuid)) {
        renderAllViews();
      }
    });
  });

  elements.managerPendingList.querySelectorAll('.btn-desk-reject').forEach(btn => {
    btn.addEventListener('click', () => {
      openRejectModal(btn.dataset.uuid);
    });
  });
}

// ==========================================================================
// Balances View
// ==========================================================================
function renderBalances() {
  const userBal = store.getBalance('EMP1001');

  elements.balanceCardsWrapper.innerHTML = userBal.map(b => `
    <div class="bal-card">
      <div class="bal-type-name">${b.label}</div>
      <div class="bal-big-num">${b.remaining}</div>
      <div class="bal-sub">Days Remaining of ${b.entitled} Total</div>
      <div class="bal-breakdown">
        <span>Used: <strong>${b.used}</strong></span>
        <span>Pending: <strong>${b.pending}</strong></span>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// Object Page Modal
// ==========================================================================
function openObjectModal(uuid) {
  const req = store.getRequests().find(r => r.uuid === uuid);
  if (!req) return;

  elements.objReqId.textContent = req.reqId;
  elements.objEmpName.textContent = `${req.empName} • ${req.empId}`;
  elements.objStatusBadge.className = 'status-chip ' + (req.status === 'A' ? 'approved' : req.status === 'R' ? 'rejected' : 'pending');
  elements.objStatusBadge.textContent = req.status === 'A' ? 'Approved' : req.status === 'R' ? 'Rejected' : 'Pending';

  elements.objLeaveType.textContent = req.leaveType;
  elements.objDuration.textContent = `${req.totalDays} Working Days`;
  elements.objDateRange.textContent = `${req.startDate} to ${req.endDate}`;
  elements.objDept.textContent = req.deptId;
  elements.objManager.textContent = `${req.managerId} (Alexander Vance)`;
  elements.objReason.textContent = req.reason;

  if (req.status === 'R' && req.rejectionReason) {
    elements.objRejectionContainer.classList.remove('hidden');
    elements.objRejectionReason.textContent = req.rejectionReason;
  } else {
    elements.objRejectionContainer.classList.add('hidden');
  }

  // Timeline
  elements.objTimeline.innerHTML = `
    <div class="timeline-item">
      <div class="timeline-time">${req.createdAt}</div>
      <div class="timeline-title">Request Created & Draft Activated (EML Create)</div>
    </div>
    ${req.status !== 'P' ? `
      <div class="timeline-item">
        <div class="timeline-time">${req.lastChangedAt}</div>
        <div class="timeline-title">Manager Action Executed: ${req.status === 'A' ? 'APPROVED (Leave quota updated)' : 'REJECTED (' + req.rejectionReason + ')'}</div>
      </div>
    ` : ''}
  `;

  // Action Buttons
  if (req.status === 'P') {
    elements.objModalActions.innerHTML = `
      <button class="fiori-btn secondary-btn" id="obj-btn-close">Close</button>
      <button class="fiori-btn danger-btn" id="obj-btn-reject"><i class="ri-close-line"></i> Reject</button>
      <button class="fiori-btn primary-btn" id="obj-btn-approve"><i class="ri-check-line"></i> Approve</button>
    `;
    document.getElementById('obj-btn-close').addEventListener('click', closeObjectModal);
    document.getElementById('obj-btn-approve').addEventListener('click', () => {
      store.approveRequest(uuid);
      closeObjectModal();
      renderAllViews();
    });
    document.getElementById('obj-btn-reject').addEventListener('click', () => {
      closeObjectModal();
      openRejectModal(uuid);
    });
  } else {
    elements.objModalActions.innerHTML = `<button class="fiori-btn primary-btn" id="obj-btn-close">Close</button>`;
    document.getElementById('obj-btn-close').addEventListener('click', closeObjectModal);
  }

  elements.modalObjectPage.classList.remove('hidden');
}

function closeObjectModal() {
  elements.modalObjectPage.classList.add('hidden');
}

// ==========================================================================
// Reject Comment Modal
// ==========================================================================
function openRejectModal(uuid) {
  activeRejectUuid = uuid;
  const req = store.getRequests().find(r => r.uuid === uuid);
  elements.rejectReqId.textContent = req ? req.reqId : '';
  elements.rejectReasonInput.value = '';
  elements.modalRejectDialog.classList.remove('hidden');
}

function closeRejectModal() {
  elements.modalRejectDialog.classList.add('hidden');
  activeRejectUuid = null;
}

function handleConfirmReject() {
  const reason = elements.rejectReasonInput.value.trim();
  if (!reason) {
    alert('Please enter a rejection reason for the employee.');
    return;
  }

  if (activeRejectUuid && store.rejectRequest(activeRejectUuid, reason)) {
    closeRejectModal();
    renderAllViews();
  }
}

// ==========================================================================
// ABAP Unit Test Suite Simulator
// ==========================================================================
const testCases = [
  {
    name: 'TEST_VALID_LEAVE_REQUEST',
    desc: 'Verify EML Create operation when requested days (3) are within remaining balance (11). Expects success.',
    execute: () => ({ pass: true, time: 12, log: 'ABAP Unit Assert: mapped-leaverequest contains valid key. Failed table is initial.' })
  },
  {
    name: 'TEST_EXCEEDING_LEAVE_BALANCE',
    desc: 'Verify RAP Validation validateLeaveBalance rejects creation when requesting 15 days against 8 remaining days.',
    execute: () => ({ pass: true, time: 18, log: 'ABAP Unit Assert: failed-leaverequest IS NOT INITIAL as expected. Message: "Leave request exceeds available balance".' })
  },
  {
    name: 'TEST_INVALID_DATE_RANGE',
    desc: 'Verify RAP Validation validateDates fails when End Date (2026-10-01) is before Start Date (2026-10-05).',
    execute: () => ({ pass: true, time: 9, log: 'ABAP Unit Assert: validation failed-leaverequest populated correctly for EndDate.' })
  },
  {
    name: 'TEST_APPROVE_ACTION_FLOW',
    desc: 'Verify Action approve changes instance status to "A" and deducts leave balance table zabs_t_lvl_bal.',
    execute: () => ({ pass: true, time: 15, log: 'ABAP Unit Assert: Status updated to "A", used_days incremented by total_days.' })
  },
  {
    name: 'TEST_REJECT_ACTION_FLOW',
    desc: 'Verify Action reject updates status to "R" and persists parameter rejection_reason.',
    execute: () => ({ pass: true, time: 11, log: 'ABAP Unit Assert: Rejection reason persisted in database buffer.' })
  }
];

function renderInitialUnitTestState() {
  elements.unitPassedCount.textContent = '0';
  elements.unitFailedCount.textContent = '0';
  elements.unitTimeCount.textContent = '0 ms';

  elements.unitTestList.innerHTML = testCases.map(tc => `
    <div class="test-item-card">
      <div class="test-title-group">
        <h4>${tc.name}</h4>
        <span class="test-desc">${tc.desc}</span>
      </div>
      <span class="test-status-badge" style="background: var(--bg-app); color: var(--text-muted);">Ready</span>
    </div>
  `).join('');
}

function runABAPUnitTestSuite() {
  elements.btnRunAllUnitTests.disabled = true;
  elements.btnRunAllUnitTests.innerHTML = '<i class="ri-loader-4-line spin"></i> Running Tests...';

  let totalTime = 0;
  let passedCount = 0;
  let failedCount = 0;

  elements.unitTestList.innerHTML = '';

  testCases.forEach((tc, idx) => {
    setTimeout(() => {
      const res = tc.execute();
      totalTime += res.time;
      if (res.pass) passedCount++; else failedCount++;

      const itemHTML = `
        <div class="test-item-card ${res.pass ? 'passed' : 'failed'}">
          <div class="test-title-group">
            <h4>${tc.name} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(${res.time} ms)</span></h4>
            <span class="test-desc">${tc.desc}</span>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--fiori-blue); margin-top: 4px;">${res.log}</div>
          </div>
          <span class="test-status-badge ${res.pass ? 'pass' : 'fail'}">${res.pass ? 'PASSED' : 'FAILED'}</span>
        </div>
      `;

      elements.unitTestList.insertAdjacentHTML('beforeend', itemHTML);

      elements.unitPassedCount.textContent = passedCount;
      elements.unitFailedCount.textContent = failedCount;
      elements.unitTimeCount.textContent = `${totalTime} ms`;

      if (idx === testCases.length - 1) {
        elements.btnRunAllUnitTests.disabled = false;
        elements.btnRunAllUnitTests.innerHTML = '<i class="ri-play-circle-fill"></i> Execute ABAP Unit Suite';
      }
    }, (idx + 1) * 200);
  });
}

// ==========================================================================
// Code Inspector Switcher
// ==========================================================================
function loadCodeSnippet(key) {
  const snippet = abapCodeSnippets[key];
  if (!snippet) return;

  elements.codeViewerTitle.textContent = snippet.title;
  elements.codeViewerType.textContent = snippet.type;
  elements.codeViewerContent.textContent = snippet.code;
}

// Run init on DOM load
document.addEventListener('DOMContentLoaded', init);
