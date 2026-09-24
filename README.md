# 🌴 Employee Leave Management App — SAP BTP ABAP RAP


An end-to-end RESTful Application Programming Model (RAP) application built for the **SAP BTP ABAP Environment . Enables employees to apply for leave, view real-time leave quota balances, and track request status while empowering line managers to execute `Approve` or `Reject` actions.

---

## ✨ Features

- Managed RAP Business Object: Modeled with Draft capability (`with draft`), instance actions (`submit`, `approve`, `reject`), determinations (`calculateTotalDays`), and validations (`validateDates`, `validateLeaveBalance`).
- Core Business Rule Validation: Prevents leave creation if requested working days exceed the employee's available leave quota.
- OData V4 & Fiori Elements: Exposed via OData V4 service `ZUI_LEAVE_REQ_V4` with standard Fiori `@UI` annotations.
- ABAP Unit Test Suite: Includes automated unit test class `ZCL_TEST_LEAVE_MGMT` verifying EML transactional statements and business rule assertions.
- abapGit Ready: Source code formatted under `abap_repository/` for instant import into SAP ADT (Eclipse).
- Interactive Web Preview**: Local Fiori Horizon test application running on `http://localhost:3000`.
