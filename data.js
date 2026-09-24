export const initialData = {
  currentUser: {
    id: 'EMP1001',
    name: 'Sarah Jenkins',
    dept: 'DEPT_SAP_CORE',
    deptName: 'SAP BTP Development',
    managerId: 'MGR2001',
    managerName: 'Alexander Vance',
    role: 'Senior ABAP RAP Developer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  employees: [
    { id: 'EMP1001', name: 'Sarah Jenkins', dept: 'SAP BTP Development', managerId: 'MGR2001' },
    { id: 'EMP1002', name: 'Michael Chang', dept: 'Enterprise Architecture', managerId: 'MGR2001' },
    { id: 'EMP1003', name: 'Elena Rostova', dept: 'UI5 / Fiori UX Team', managerId: 'MGR2002' },
    { id: 'EMP1004', name: 'David Miller', dept: 'Cloud Integration', managerId: 'MGR2001' }
  ],
  leaveBalances: {
    EMP1001: [
      { leaveType: 'VACATION', label: 'Annual Vacation', entitled: 20, used: 6, pending: 3, remaining: 11, unit: 'DAYS', color: '#3b82f6' },
      { leaveType: 'SICK', label: 'Medical / Sick Leave', entitled: 10, used: 2, pending: 0, remaining: 8, unit: 'DAYS', color: '#ef4444' },
      { leaveType: 'CASUAL', label: 'Casual / Personal', entitled: 7, used: 3, pending: 1, remaining: 3, unit: 'DAYS', color: '#f59e0b' },
      { leaveType: 'PARENTAL', label: 'Parental / Family Care', entitled: 14, used: 0, pending: 0, remaining: 14, unit: 'DAYS', color: '#8b5cf6' }
    ],
    EMP1002: [
      { leaveType: 'VACATION', label: 'Annual Vacation', entitled: 20, used: 12, pending: 0, remaining: 8, unit: 'DAYS', color: '#3b82f6' },
      { leaveType: 'SICK', label: 'Medical / Sick Leave', entitled: 10, used: 6, pending: 0, remaining: 4, unit: 'DAYS', color: '#ef4444' },
      { leaveType: 'CASUAL', label: 'Casual / Personal', entitled: 7, used: 5, pending: 0, remaining: 2, unit: 'DAYS', color: '#f59e0b' }
    ],
    EMP1003: [
      { leaveType: 'VACATION', label: 'Annual Vacation', entitled: 25, used: 8, pending: 4, remaining: 13, unit: 'DAYS', color: '#3b82f6' },
      { leaveType: 'SICK', label: 'Medical / Sick Leave', entitled: 10, used: 1, pending: 0, remaining: 9, unit: 'DAYS', color: '#ef4444' }
    ]
  },
  leaveRequests: [
    {
      uuid: 'req-001',
      reqId: 'LR-2026-0042',
      empId: 'EMP1001',
      empName: 'Sarah Jenkins',
      deptId: 'SAP BTP Development',
      managerId: 'MGR2001',
      leaveType: 'VACATION',
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      totalDays: 5,
      status: 'P', // P = Pending
      reason: 'Attending SAP TechEd & taking annual recovery leaves.',
      rejectionReason: '',
      createdAt: '2026-09-20 10:15:00',
      lastChangedAt: '2026-09-20 10:15:00'
    },
    {
      uuid: 'req-002',
      reqId: 'LR-2026-0038',
      empId: 'EMP1001',
      empName: 'Sarah Jenkins',
      deptId: 'SAP BTP Development',
      managerId: 'MGR2001',
      leaveType: 'SICK',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
      totalDays: 2,
      status: 'A', // Approved
      reason: 'Dental surgery and follow-up medical consultation.',
      rejectionReason: '',
      createdAt: '2026-08-30 08:30:00',
      lastChangedAt: '2026-08-30 14:22:00'
    },
    {
      uuid: 'req-003',
      reqId: 'LR-2026-0029',
      empId: 'EMP1002',
      empName: 'Michael Chang',
      deptId: 'Enterprise Architecture',
      managerId: 'MGR2001',
      leaveType: 'VACATION',
      startDate: '2026-09-28',
      endDate: '2026-10-02',
      totalDays: 5,
      status: 'P',
      reason: 'Family vacation to Kyoto.',
      rejectionReason: '',
      createdAt: '2026-09-22 14:00:00',
      lastChangedAt: '2026-09-22 14:00:00'
    },
    {
      uuid: 'req-004',
      reqId: 'LR-2026-0015',
      empId: 'EMP1003',
      empName: 'Elena Rostova',
      deptId: 'UI5 / Fiori UX Team',
      managerId: 'MGR2002',
      leaveType: 'CASUAL',
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      totalDays: 3,
      status: 'R',
      reason: 'Personal relocation work.',
      rejectionReason: 'Critical sprint release week scheduled for UI5 component library.',
      createdAt: '2026-08-05 11:10:00',
      lastChangedAt: '2026-08-06 09:45:00'
    }
  ]
};

// Store current working state in localStorage or memory
export class LeaveMgmtStore {
  constructor() {
    const savedReqs = localStorage.getItem('abap_rap_leave_reqs');
    const savedBal = localStorage.getItem('abap_rap_leave_bal');
    this.requests = savedReqs ? JSON.parse(savedReqs) : initialData.leaveRequests;
    this.balances = savedBal ? JSON.parse(savedBal) : initialData.leaveBalances;
  }

  save() {
    localStorage.setItem('abap_rap_leave_reqs', JSON.stringify(this.requests));
    localStorage.setItem('abap_rap_leave_bal', JSON.stringify(this.balances));
  }

  getRequests() {
    return this.requests;
  }

  getBalance(empId) {
    return this.balances[empId] || initialData.leaveBalances['EMP1001'];
  }

  // Calculate working days (excluding weekends)
  calculateWorkingDays(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) return 0;

    let count = 0;
    let cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) { // Exclude Sun & Sat
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 1;
  }

  // ABAP RAP Validation Engine Simulation
  validateLeaveRequest(empId, leaveType, startDateStr, endDateStr) {
    const errors = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const today = new Date('2026-09-24'); // Fixed current date context

    if (!startDateStr || !endDateStr) {
      errors.push('Start Date and End Date are mandatory fields.');
      return { valid: false, errors, totalDays: 0 };
    }

    if (end < start) {
      errors.push(`End Date (${endDateStr}) cannot be earlier than Start Date (${startDateStr}). [RAP Validation ZCL_BP_I_LEAVE_REQ->VALIDATE_DATES]`);
    }

    const totalDays = this.calculateWorkingDays(startDateStr, endDateStr);

    // Get remaining balance
    const userBal = this.getBalance(empId);
    const balObj = userBal.find(b => b.leaveType === leaveType);
    const remaining = balObj ? balObj.remaining : 0;

    if (totalDays > remaining) {
      errors.push(
        `Business Rule Violation: Requested ${totalDays} days exceed available ${leaveType} balance (${remaining} days). [RAP EML Validation ZCL_BP_I_LEAVE_REQ->VALIDATE_LEAVE_BALANCE]`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      totalDays,
      remainingAvailable: remaining
    };
  }

  createRequest({ empId, empName, leaveType, startDate, endDate, reason }) {
    const validation = this.validateLeaveRequest(empId, leaveType, startDate, endDate);
    if (!validation.valid) {
      throw new Error(validation.errors.join('\n'));
    }

    const newId = `LR-2026-00${Math.floor(100 + Math.random() * 900)}`;
    const uuid = `req-${Date.now()}`;
    const newReq = {
      uuid,
      reqId: newId,
      empId,
      empName,
      deptId: 'SAP BTP Development',
      managerId: 'MGR2001',
      leaveType,
      startDate,
      endDate,
      totalDays: validation.totalDays,
      status: 'P', // Pending approval
      reason,
      rejectionReason: '',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastChangedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    this.requests.unshift(newReq);

    // Update pending balance
    const userBal = this.balances[empId];
    if (userBal) {
      const targetBal = userBal.find(b => b.leaveType === leaveType);
      if (targetBal) {
        targetBal.pending += validation.totalDays;
        targetBal.remaining -= validation.totalDays;
      }
    }

    this.save();
    return newReq;
  }

  approveRequest(uuid) {
    const req = this.requests.find(r => r.uuid === uuid);
    if (!req) return false;
    if (req.status !== 'P') return false;

    req.status = 'A';
    req.lastChangedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update balance
    const userBal = this.balances[req.empId];
    if (userBal) {
      const targetBal = userBal.find(b => b.leaveType === req.leaveType);
      if (targetBal) {
        targetBal.used += req.totalDays;
        targetBal.pending = Math.max(0, targetBal.pending - req.totalDays);
      }
    }

    this.save();
    return true;
  }

  rejectRequest(uuid, reason) {
    const req = this.requests.find(r => r.uuid === uuid);
    if (!req) return false;
    if (req.status !== 'P') return false;

    req.status = 'R';
    req.rejectionReason = reason || 'Request rejected by line manager.';
    req.lastChangedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Restore pending balance to remaining
    const userBal = this.balances[req.empId];
    if (userBal) {
      const targetBal = userBal.find(b => b.leaveType === req.leaveType);
      if (targetBal) {
        targetBal.pending = Math.max(0, targetBal.pending - req.totalDays);
        targetBal.remaining += req.totalDays;
      }
    }

    this.save();
    return true;
  }

  resetDemoData() {
    localStorage.removeItem('abap_rap_leave_reqs');
    localStorage.removeItem('abap_rap_leave_bal');
    this.requests = JSON.parse(JSON.stringify(initialData.leaveRequests));
    this.balances = JSON.parse(JSON.stringify(initialData.leaveBalances));
  }
}
