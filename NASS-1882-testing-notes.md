# Manual Testing Notes: Lab Request Result Notifications

**Issue:** NASS-1882 - Update Lab Request Notifications for interim or amended results

**Figma Design:** [View mockups](https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=23664-42450&t=SxzmzcdCmRiPLAcr-0)

---

## Overview

### Current Behavior
Currently, a single notification is sent when a lab request enters any of these statuses:
- Interim results
- Published
- Invalidated

### New Behavior
The notifications should be updated to:
1. Display an **'Interim results'** notification when the lab request moves TO 'Interim results' status
2. Display the **regular notification** when the lab request moves TO 'Published' status
3. Display a **'Results amended'** notification when the lab request moves FROM 'Published' to any other status
   - **Exception:** If moving FROM Published TO Interim results, only send the 'Results amended' notification (not both 'Results amended' and 'Interim results')

---

## Technical Context

### Database Models
- **LabRequest** model (`packages/database/src/models/LabRequest.ts`): Contains status field and afterUpdate hook that triggers notifications
- **Notification** model (`packages/database/src/models/Notification.ts`): Stores notifications with metadata
- **LabRequestLog** model (`packages/database/src/models/LabRequestLog.ts`): Tracks status change history

### Lab Request Statuses
Available statuses (from `packages/constants/src/labs.ts`):
- `reception_pending` - Reception pending
- `results_pending` - Results pending
- `interim_results` - Interim results
- `to_be_verified` - To be verified
- `verified` - Verified
- `published` - Published
- `sample-not-collected` - Sample not collected
- `cancelled` - Cancelled
- `invalidated` - Invalidated
- `deleted` - Deleted
- `entered-in-error` - Entered in error

### Current Hook Implementation
Location: `packages/database/src/models/LabRequest.ts` lines 110-141

```typescript
afterUpdate: async (labRequest: LabRequest, options) => {
  const shouldPushNotification = [
    LAB_REQUEST_STATUSES.INTERIM_RESULTS,
    LAB_REQUEST_STATUSES.PUBLISHED,
    LAB_REQUEST_STATUSES.INVALIDATED,
  ].includes(labRequest.status);

  if (shouldPushNotification && labRequest.status !== labRequest.previous('status')) {
    await models.Notification.pushNotification(
      NOTIFICATION_TYPES.LAB_REQUEST,
      labRequest.dataValues,
      { transaction: options.transaction },
    );
  }
  // ... deletion logic for DELETED/ENTERED_IN_ERROR statuses
}
```

---

## Test Setup Prerequisites

### User Setup
1. Create or use an existing test user with permissions to:
   - Create lab requests
   - Update lab request statuses
   - View notifications

### Patient Setup
1. Create or use a test patient
2. Create an active encounter for the patient (required for lab requests)

### Lab Request Setup
1. Create a lab request with at least one test
2. Note the Lab Request ID (display ID shown in UI)
3. Note the requesting clinician user

---

## Test Scenarios

### Scenario 1: New Interim Results Notification

**Objective:** Verify that an 'Interim results' notification is created when a lab request moves TO 'Interim results' status

#### Test Steps:
1. Log in as a user with lab request permissions
2. Navigate to a patient's lab requests
3. Create a new lab request (or use an existing one in 'Reception pending' or 'Results pending' status)
4. Update the lab request status to **'Interim results'**
   - This can be done via the status dropdown or three-dots menu
5. Check the notification system

#### Expected Results:
- ✓ A notification is created for the requesting clinician
- ✓ Notification type: `LAB_REQUEST`
- ✓ Notification displays as **'Interim results'** (verify UI text)
- ✓ Notification metadata contains lab request ID and relevant details
- ✓ Notification status is 'unread'
- ✓ Notification timestamp matches the status change time

#### Database Verification:
```sql
-- Check notification was created
SELECT * FROM notifications 
WHERE metadata->>'id' = '<lab-request-id>' 
ORDER BY created_at DESC LIMIT 1;

-- Check status log was updated
SELECT * FROM lab_request_logs 
WHERE lab_request_id = '<lab-request-id>' 
ORDER BY updated_at DESC;
```

---

### Scenario 2: Standard Published Notification

**Objective:** Verify that a regular notification is created when a lab request moves TO 'Published' status (not from Published)

#### Test Steps:
1. Log in as a user with lab request permissions
2. Navigate to a patient's lab requests
3. Use a lab request that is NOT currently in 'Published' status (e.g., 'Verified', 'To be verified', or 'Interim results')
4. Update the lab request status to **'Published'**
5. Check the notification system

#### Expected Results:
- ✓ A notification is created for the requesting clinician
- ✓ Notification type: `LAB_REQUEST`
- ✓ Notification displays as standard published notification (verify UI text)
- ✓ Notification metadata contains lab request ID
- ✓ Only ONE notification is created (not multiple)

#### Database Verification:
```sql
-- Verify single notification for this status change
SELECT COUNT(*) FROM notifications 
WHERE metadata->>'id' = '<lab-request-id>' 
AND created_at > '<timestamp-before-status-change>';
```

---

### Scenario 3: Results Amended Notification (Published → Other Status)

**Objective:** Verify that a 'Results amended' notification is created when a lab request moves FROM 'Published' TO any other status

#### Sub-scenario 3a: Published → Interim Results
1. Create or use a lab request with status **'Published'**
2. Update the status to **'Interim results'**
3. Check notifications

**Expected Results:**
- ✓ A **'Results amended'** notification is created
- ✓ NO 'Interim results' notification is created (avoid duplicate)
- ✓ Only ONE notification is created for this status change

#### Sub-scenario 3b: Published → To be verified
1. Create or use a lab request with status **'Published'**
2. Update the status to **'To be verified'**
3. Check notifications

**Expected Results:**
- ✓ A **'Results amended'** notification is created
- ✓ Notification indicates results have been amended/changed

#### Sub-scenario 3c: Published → Verified
1. Create or use a lab request with status **'Published'**
2. Update the status to **'Verified'**
3. Check notifications

**Expected Results:**
- ✓ A **'Results amended'** notification is created

#### Sub-scenario 3d: Published → Invalidated
1. Create or use a lab request with status **'Published'**
2. Update the status to **'Invalidated'**
3. Check notifications

**Expected Results:**
- ✓ A **'Results amended'** notification is created

---

### Scenario 4: No Notification for Non-Triggering Status Changes

**Objective:** Verify that notifications are NOT created for status changes that shouldn't trigger them

#### Test Cases:
1. **Reception pending → Results pending**
   - Expected: No notification

2. **Results pending → To be verified**
   - Expected: No notification

3. **To be verified → Verified**
   - Expected: No notification

4. **Verified → To be verified** (going backwards)
   - Expected: No notification UNLESS coming FROM Published

5. **Sample not collected → Reception pending**
   - Expected: No notification

#### Test Steps (for each):
1. Set lab request to starting status
2. Change to target status
3. Verify no new notification is created

---

### Scenario 5: Notification Deletion for Deleted/Entered in Error

**Objective:** Verify that existing notifications are deleted when a lab request is marked as deleted or entered in error

#### Test Steps:
1. Create a lab request and move it to 'Published' (should create a notification)
2. Verify the notification exists
3. Change the lab request status to **'Deleted'** or **'Entered in error'**
4. Check notifications

#### Expected Results:
- ✓ Previous notifications for this lab request are deleted
- ✓ No notifications remain for this lab request ID

#### Database Verification:
```sql
-- Should return 0 rows
SELECT * FROM notifications 
WHERE metadata->>'id' = '<lab-request-id>';
```

---

### Scenario 6: Multiple Status Changes (Workflow Testing)

**Objective:** Verify correct notification behavior through a complete lab request workflow

#### Test Steps:
1. Create a new lab request (status: **Reception pending**)
   - Expected: No notification
   
2. Update to **Results pending**
   - Expected: No notification
   
3. Update to **Interim results**
   - Expected: 'Interim results' notification created
   
4. Update to **To be verified**
   - Expected: No new notification
   
5. Update to **Verified**
   - Expected: No new notification
   
6. Update to **Published**
   - Expected: Regular published notification created
   
7. Update back to **Verified** (amending results)
   - Expected: 'Results amended' notification created
   
8. Update to **Published** again
   - Expected: Regular published notification created

#### Expected Results:
- ✓ Total of 4 notifications created through this workflow
- ✓ Each notification has correct type/message
- ✓ Notifications are created at the correct steps
- ✓ Status log shows all status changes

---

### Scenario 7: Edge Case - Rapid Status Changes

**Objective:** Verify notification handling when status changes happen in quick succession

#### Test Steps:
1. Create a lab request
2. Quickly change status: Reception pending → Results pending → Interim results → Published
3. Check notifications

#### Expected Results:
- ✓ 'Interim results' notification created
- ✓ 'Published' notification created
- ✓ No duplicate notifications
- ✓ All status changes logged in LabRequestLog

---

### Scenario 8: Edge Case - Same Status Update

**Objective:** Verify no duplicate notification when status is "updated" to the same value

#### Test Steps:
1. Set lab request to **'Published'**
2. "Update" the status to **'Published'** again (no actual change)
3. Check notifications

#### Expected Results:
- ✓ No new notification is created (status didn't actually change)
- ✓ The `status !== previous('status')` check prevents duplicates

---

### Scenario 9: Permission-Based Testing

**Objective:** Verify notifications are sent to the correct user (requesting clinician)

#### Test Steps:
1. Log in as **User A**
2. Create a lab request as User A (requesting clinician: User A)
3. Log out and log in as **User B** (a different user with lab permissions)
4. As User B, update the lab request status to 'Published'
5. Check notifications for both users

#### Expected Results:
- ✓ Notification is created and associated with **User A** (the requesting clinician)
- ✓ User A can see the notification in their notification list
- ✓ User B does not see this notification in their list (unless they're also involved)

---

## UI Verification Checklist

### Notification Display
- [ ] Notification appears in the notification center/bell icon
- [ ] 'Interim results' notification shows appropriate icon/styling (check Figma)
- [ ] Regular published notification shows appropriate icon/styling
- [ ] 'Results amended' notification shows appropriate icon/styling and differentiation
- [ ] Notification text is clear and actionable
- [ ] Clicking notification navigates to the lab request details
- [ ] Notification can be marked as read
- [ ] Read/unread status persists across sessions

### Lab Request Status Display
- [ ] Status badge shows correct color for each status (per `LAB_REQUEST_STATUS_CONFIG`)
  - Interim results: `#006278` (teal)
  - Published: Green
  - Verified: Blue
- [ ] Status log modal shows all status changes with timestamps
- [ ] Status log shows the user who made each change

---

## Regression Testing

### Areas to Verify Haven't Broken:
1. **Imaging Request Notifications** - Ensure imaging request notifications still work
2. **Pharmacy Note Notifications** - Ensure pharmacy notifications still work
3. **Lab Request Deletion** - Ensure notification deletion on DELETED/ENTERED_IN_ERROR still works
4. **Sync Functionality** - Verify lab requests and notifications sync correctly between devices
5. **FHIR Integration** - If applicable, verify FHIR DiagnosticReport status mapping still works

---

## Test Data Recording Template

Use this template to record test results:

| Test Scenario | Lab Request ID | From Status | To Status | Notification Created? | Notification Type | Pass/Fail | Notes |
|--------------|----------------|-------------|-----------|---------------------|------------------|-----------|-------|
| 1 - Interim | LR-123 | Results pending | Interim results | Yes | Interim results | PASS | |
| 2 - Published | LR-123 | Interim results | Published | Yes | Published | PASS | |
| 3a - Amended | LR-123 | Published | Interim results | Yes | Results amended | PASS | |
| 3b - Amended | LR-124 | Published | To be verified | Yes | Results amended | PASS | |
| ... | ... | ... | ... | ... | ... | ... | |

---

## Known Limitations & Considerations

1. **Network Sync:** If testing in an offline/sync environment, notifications should queue and send when connection is restored
2. **Transaction Safety:** Status changes and notification creation happen in the same database transaction
3. **User Context:** Notifications are always sent to the `requestedById` user (requesting clinician)
4. **Patient Context:** Notifications require a valid encounter with a patient
5. **Mobile App:** If testing on mobile, verify notifications appear in the mobile notification list

---

## Troubleshooting

### No Notification Created
- Check that the status actually changed (use status log)
- Verify the `requestedById` field is set on the lab request
- Check that the encounter exists and has a valid `patientId`
- Look for errors in application logs: "Error pushing notification"

### Wrong Notification Type
- Verify the previous status value in the database
- Check the notification metadata JSON field for status information

### Multiple Notifications Created
- Check for race conditions in rapid status updates
- Verify the transaction isolation level

---

## Sign-off

**Tester Name:** ___________________________

**Date:** ___________________________

**Environment:** ___________________________

**Build/Commit:** ___________________________

**Overall Result:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

**Issues Found:**
1. 
2. 
3. 

**Additional Notes:**


