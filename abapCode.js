export const abapCodeSnippets = {
  cds_interface: {
    title: 'ZABS_I_LEAVE_REQ (CDS Root Interface View)',
    type: 'CDS View Entity',
    code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'CDS Interface View - Leave Request Root'
define root view entity ZABS_I_LEAVE_REQ
  as select from zabs_t_leave_req
  association [1..1] to ZABS_I_LEAVE_BALANCE as _LeaveBalance 
    on  $projection.EmployeeID = _LeaveBalance.EmployeeID
    and $projection.LeaveType  = _LeaveBalance.LeaveType
{
  key req_uuid        as RequestUUID,
      req_id          as RequestID,
      emp_id          as EmployeeID,
      emp_name        as EmployeeName,
      dept_id         as DepartmentID,
      manager_id      as ManagerID,
      leave_type      as LeaveType,
      start_date      as StartDate,
      end_date        as EndDate,
      total_days      as TotalDays,
      status          as Status, // P = Pending, A = Approved, R = Rejected
      reason          as Reason,
      rejection_reason as RejectionReason,
      
      @Semantics.user.createdBy: true
      created_by      as CreatedBy,
      @Semantics.systemDateTime.createdAt: true
      created_at      as CreatedAt,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at as LastChangedAt,

      _LeaveBalance
}`
  },
  cds_projection: {
    title: 'ZABS_C_LEAVE_REQ (CDS Projection View + UI Annotations)',
    type: 'CDS Projection Entity',
    code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'CDS Projection View - Leave Request'
@Metadata.allowExtensions: true
@Search.searchable: true
@UI.headerInfo: { typeName: 'Leave Request', typeNamePlural: 'Leave Requests', title: { value: 'RequestID' } }
define root view entity ZABS_C_LEAVE_REQ
  provider contract transactional_query
  as projection on ZABS_I_LEAVE_REQ
{
  @UI.hidden: true
  key RequestUUID,

  @UI.lineItem: [{ position: 10, label: 'Request ID' }]
  RequestID,

  @UI.lineItem: [{ position: 20, label: 'Employee ID' }]
  @UI.selectionField: [{ position: 10 }]
  EmployeeID,

  @UI.lineItem: [{ position: 30, label: 'Employee Name' }]
  EmployeeName,

  @UI.lineItem: [{ position: 40, label: 'Leave Type' }]
  @UI.selectionField: [{ position: 20 }]
  LeaveType,

  @UI.lineItem: [{ position: 50, label: 'Start Date' }]
  StartDate,

  @UI.lineItem: [{ position: 60, label: 'End Date' }]
  EndDate,

  @UI.lineItem: [{ position: 70, label: 'Days Requested' }]
  TotalDays,

  @UI.lineItem: [
    { position: 80, label: 'Status', criticalities: 'StatusCriticality' },
    { type: #FOR_ACTION, dataAction: 'approve', label: 'Approve' },
    { type: #FOR_ACTION, dataAction: 'reject', label: 'Reject' }
  ]
  Status,

  case Status
    when 'A' then 3 // Green
    when 'P' then 2 // Yellow
    when 'R' then 1 // Red
    else 0
  end as StatusCriticality,

  Reason,
  RejectionReason,
  _LeaveBalance
}`
  },
  bdef: {
    title: 'ZABS_I_LEAVE_REQ.BDEF (Behavior Definition)',
    type: 'Behavior Definition',
    code: `managed implementation in class zcl_bp_i_leave_req unique;
strict ( 2 );
with draft;

define behavior for ZABS_I_LEAVE_REQ alias LeaveRequest
persistent table zabs_t_leave_req
draft table zabs_d_leave_req
lock master
total etag LastChangedAt
authorization master ( instance )
{
  create;
  update;
  delete;

  field ( readonly, numbering : managed ) RequestUUID;
  field ( readonly ) RequestID, Status, TotalDays, CreatedBy, CreatedAt;
  field ( mandatory : create ) EmployeeID, LeaveType, StartDate, EndDate;

  // Actions
  action ( features : instance ) submit result [1] $self;
  action ( features : instance ) approve result [1] $self;
  action ( features : instance ) reject parameter ZABS_A_REJECT_REASON result [1] $self;

  // Determinations
  determination calculateTotalDays on modify { field StartDate, EndDate; }

  // Validations
  validation validateDates on save { field StartDate, EndDate; create; update; }
  validation validateLeaveBalance on save { field EmployeeID, LeaveType, TotalDays; create; update; }
}`
  },
  bimp: {
    title: 'ZCL_BP_I_LEAVE_REQ (ABAP Behavior Pool Implementation)',
    type: 'ABAP Behavior Class',
    code: `CLASS lhc_LeaveRequest IMPLEMENTATION.

  METHOD validateLeaveBalance.
    READ ENTITIES OF zabs_i_leave_req IN LOCAL MODE
      ENTITY LeaveRequest
        FIELDS ( EmployeeID LeaveType TotalDays StartDate EndDate ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_requests).

    LOOP AT lt_requests INTO DATA(ls_req).
      DATA(lv_requested_days) = ls_req-TotalDays.

      SELECT SINGLE remaining_days 
        FROM zabs_t_lvl_bal
        WHERE emp_id     = @ls_req-EmployeeID
          AND leave_type = @ls_req-LeaveType
        INTO @DATA(lv_remaining_days).

      " Core Business Rule: Reject request exceeding available leave balance
      IF lv_requested_days > lv_remaining_days.
        APPEND VALUE #( %tky = ls_req-%tky ) TO failed-leaverequest.
        APPEND VALUE #( %tky = ls_req-%tky
                        %msg = new_message_with_text(
                          severity = if_abap_behv_message=>severity-error
                          text     = |Leave request ({ lv_requested_days } days) exceeds available balance ({ lv_remaining_days } days).|
                        ) ) TO reported-leaverequest.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD approve.
    MODIFY ENTITIES OF zabs_i_leave_req IN LOCAL MODE
      ENTITY LeaveRequest
        UPDATE FIELDS ( Status )
        WITH VALUE #( FOR key IN keys ( %tky = key-%tky Status = 'A' ) ).

    " Update database leave balance
    LOOP AT lt_requests INTO DATA(ls_req).
      UPDATE zabs_t_lvl_bal
        SET used_days      = used_days + ls_req-TotalDays,
            remaining_days = remaining_days - ls_req-TotalDays
        WHERE emp_id     = ls_req-EmployeeID
          AND leave_type = ls_req-LeaveType.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.`
  },
  unit_tests: {
    title: 'ZCL_TEST_LEAVE_MGMT (ABAP Unit Test Suite)',
    type: 'ABAP Unit Test Class',
    code: `CLASS ltcl_leave_mgmt_unit IMPLEMENTATION.

  METHOD test_exceeding_leave_balance.
    " Test Business Rule: Request exceeding leave balance must fail validation
    DATA: lt_create TYPE TABLE FOR CREATE zabs_i_leave_req,
          mapped    TYPE RESPONSE FOR MAPPED zabs_i_leave_req,
          failed    TYPE RESPONSE FOR FAILED zabs_i_leave_req,
          reported  TYPE RESPONSE FOR REPORTED zabs_i_leave_req.

    lt_create = VALUE #( (
      %cid         = 'CID_EXCEED_01'
      EmployeeID   = 'EMP1002'
      LeaveType    = 'SICK'
      StartDate    = cl_abap_context_info=>get_system_date( ) + 1
      EndDate      = cl_abap_context_info=>get_system_date( ) + 10
      TotalDays    = 10
      Reason       = 'Elective Surgery'
    ) ).

    MODIFY ENTITIES OF zabs_i_leave_req
      ENTITY LeaveRequest
        CREATE FIELDS ( EmployeeID LeaveType StartDate EndDate TotalDays Reason )
        WITH lt_create
      MAPPED mapped
      FAILED failed
      REPORTED reported.

    cl_abap_unit_assert=>assert_not_initial(
      act = failed-leaverequest
      msg = 'Leave request exceeding balance MUST fail validation'
    ).
  ENDMETHOD.

ENDCLASS.`
  }
};
