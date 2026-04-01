# Testing Notes: COOL-52 Admin Impersonation Feature

## Overview
This feature allows super admins to impersonate other roles to test permissions and troubleshoot user issues. The implementation adds a JWT-based role impersonation system with UI controls accessible via Cmd/Ctrl+click on the avatar.

---

## Critical Security Requirements

### ✅ Must Pass - Core Security Tests

#### 1. **Authentication & Authorization**
- [ ] Only users with `role === 'admin'` can access impersonation endpoints
- [ ] Non-admin users attempting to call `/admin/impersonate` receive 403 Forbidden
- [ ] Non-admin users attempting to call `/admin/roles` receive 403 Forbidden
- [ ] Impersonation UI (popover) only appears for admin users
- [ ] Non-admin users cannot trigger impersonation via client-side manipulation

#### 2. **Token Security**
- [ ] `impersonateRoleId` is properly embedded in JWT token payload
- [ ] Token signature validation still works with impersonation field
- [ ] Tokens cannot be tampered with (changing `impersonateRoleId` invalidates signature)
- [ ] Token refresh (`/refresh`) preserves impersonation state correctly
- [ ] Facility switching (`/setFacility`) preserves impersonation state correctly

#### 3. **Permission Enforcement**
- [ ] Impersonated role permissions are correctly applied to all API requests
- [ ] Admin cannot bypass permissions by impersonating and then manually changing requests
- [ ] `req.ability` on server reflects impersonated role, not admin role
- [ ] UI permission checks (CASL ability) reflect impersonated role
- [ ] Admin retains ability to read/write their own User record during impersonation (for settings/logout)

#### 4. **Role Validation**
- [ ] Cannot impersonate a role that doesn't exist (returns 403)
- [ ] Cannot impersonate own role (returns 403 with "Cannot impersonate your own role")
- [ ] Cannot impersonate with invalid/malformed roleId
- [ ] Stopping impersonation (roleId: null) properly restores admin permissions

#### 5. **Session Persistence & Recovery**
- [ ] Impersonation state survives page refresh
- [ ] If impersonated role is deleted, session recovery gracefully stops impersonation
- [ ] If impersonated role permissions change, they are reflected after refresh
- [ ] Stale impersonation tokens are handled gracefully (fallback to admin)

---

## Functional Testing

### Basic Workflow
1. [ ] **Start Impersonation**
   - Login as admin user
   - Cmd/Ctrl+click on avatar in sidebar
   - Popover appears with list of available roles
   - Select a role (e.g., "Practitioner")
   - UI updates to show impersonation indicator
   - Avatar shows pulsing animation
   - Role name displays as "Practitioner (impersonating)"

2. [ ] **During Impersonation**
   - Navigate to various pages (patients, reports, settings, etc.)
   - Verify only features accessible to impersonated role are visible
   - Attempt actions that impersonated role cannot perform → should fail with permission error
   - Verify audit logs record actions with correct user (admin) but impersonated context

3. [ ] **Stop Impersonation**
   - Cmd/Ctrl+click avatar again
   - Click "Stop impersonating"
   - UI returns to normal admin view
   - Avatar animation stops
   - Full admin permissions restored
   - Can access admin-only features again

### Edge Cases

#### Impersonation State Management
- [ ] **Multiple Browser Tabs**
  - Start impersonation in Tab A
  - Open Tab B → should NOT automatically reflect impersonation (separate session)
  - Stop impersonation in Tab A
  - Tab B continues with its own state (expected behavior)

- [ ] **Session Timeout During Impersonation**
  - Start impersonation
  - Wait for session to timeout
  - Should be logged out gracefully
  - Re-login should NOT restore impersonation state

- [ ] **Logout During Impersonation**
  - Start impersonation
  - Click logout
  - Impersonation state cleared from localStorage
  - Re-login as admin → no impersonation active

#### Role & Permission Edge Cases
- [ ] **Impersonate Role with No Permissions**
  - Create a role with zero permissions
  - Impersonate it
  - Verify UI shows minimal/no navigation options
  - Verify API requests fail with 403 for protected resources

- [ ] **Impersonate Role with Partial Permissions**
  - Impersonate a role that can read but not write patients
  - Can view patient list and details
  - Cannot create, edit, or delete patients
  - Edit buttons/forms are hidden or disabled

- [ ] **Impersonate Role Then Switch Facilities**
  - Start impersonation
  - Switch to different facility
  - Impersonation state persists
  - Permissions still reflect impersonated role in new facility

- [ ] **Role Deleted While Impersonating**
  - Admin impersonates Role X
  - Another admin deletes Role X from database
  - Refresh page
  - Should gracefully stop impersonation (role not found)
  - Should log warning/error
  - Should restore admin permissions

#### Token & API Edge Cases
- [ ] **Concurrent Impersonation Changes**
  - Start impersonating Role A
  - Immediately switch to Role B (before first request completes)
  - Verify final state is Role B
  - No race conditions or mixed permission states

- [ ] **Invalid Token Manipulation**
  - Start impersonation (get token)
  - Manually edit token in localStorage (change impersonateRoleId)
  - Make API request
  - Should fail with 401 Invalid Token (signature mismatch)

- [ ] **Impersonate with Expired Token**
  - Start impersonation
  - Manually set token expiry to past time
  - Make API request
  - Should fail with 401 and prompt re-login

- [ ] **Non-Admin User with Forged Token**
  - As non-admin user, manually craft token with impersonateRoleId
  - Token signature will be invalid → 401
  - Even if signature valid, backend checks `user.role !== 'admin'` → 403

#### UI/UX Edge Cases
- [ ] **Impersonation Indicator Visibility**
  - Avatar color changes to red (#f76853) during impersonation
  - Pulsing animation is visible and not distracting
  - Role name clearly shows "(impersonating)" suffix
  - Indicator persists across page navigation

- [ ] **Popover Interaction**
  - Popover closes when clicking outside
  - Popover closes when selecting a role
  - Popover shows active role highlighted
  - "Stop impersonating" button only shows when actively impersonating
  - Roles are sorted alphabetically
  - Admin's own role is excluded from list

- [ ] **Keyboard/Accessibility**
  - Can open popover with keyboard (if focus on avatar)
  - Can navigate role list with arrow keys
  - Can select role with Enter key
  - Screen reader announces impersonation state

#### Backend Security Edge Cases
- [ ] **Permission Check Bypass Attempts**
  - While impersonating low-privilege role, attempt to:
    - Call admin-only endpoints directly (e.g., `/admin/roles`) → 403
    - Modify patient records without write permission → 403
    - Access reports without report permission → 403
  - Verify `req.ability` is correctly scoped to impersonated role

- [ ] **Impersonation Logging**
  - Check server logs for impersonation start/stop events
  - Logs should include: `userId`, `action` (start/stop), `impersonateRoleId`
  - Audit trail should distinguish admin actions from impersonated actions

- [ ] **Database Permission Queries**
  - Impersonate role with complex permissions (multiple verbs/nouns)
  - Verify `getPermissionsForRoles()` correctly fetches impersonated role permissions
  - Verify CASL ability is built with correct permission set

#### Client-Side Security Edge Cases
- [ ] **LocalStorage Tampering**
  - Start impersonation (state saved to localStorage)
  - Manually edit localStorage to change impersonated role
  - Refresh page
  - Token validation should fail or restore correct state from token

- [ ] **Redux State Manipulation**
  - Use browser dev tools to dispatch `IMPERSONATE_ROLE` action as non-admin
  - UI may change, but API requests should still fail (token doesn't have impersonateRoleId)

- [ ] **Ability Object Tampering**
  - Attempt to modify `ability` object in Redux store
  - API requests still enforced by server-side permissions
  - Client-side changes have no security impact (defense in depth)

---

## Regression Testing

### Existing Functionality Should Not Break
- [ ] **Normal Admin Login/Logout**
  - Admin login without impersonation works as before
  - Full admin permissions available
  - No unexpected permission errors

- [ ] **Non-Admin User Workflows**
  - Non-admin users (practitioners, nurses, etc.) unaffected
  - No new errors or permission issues
  - UI does not show impersonation controls

- [ ] **Token Refresh & Facility Switching**
  - Without impersonation, token refresh works normally
  - Facility switching works normally
  - No unexpected token validation errors

- [ ] **Permission Checks**
  - All existing permission checks still function correctly
  - `req.checkPermission()` works as expected
  - CASL ability checks work as expected

---

## Performance & Scalability

- [ ] **Token Size**
  - JWT token size increase is minimal (one additional field)
  - Token still fits within header size limits

- [ ] **Permission Query Performance**
  - `getPermissionsForRoles()` query performance acceptable
  - No N+1 queries introduced
  - Caching still works correctly

- [ ] **UI Responsiveness**
  - Popover opens/closes smoothly
  - Role list loads quickly (even with many roles)
  - Switching roles is fast (< 500ms)

---

## Security Audit Checklist

### Code Review Points
- [ ] **JWT Payload Validation**
  - `impersonateRoleId` is optional and validated with Zod schema
  - Token parsing handles missing/invalid `impersonateRoleId` gracefully

- [ ] **Backend Authorization**
  - All impersonation endpoints check `user.role === 'admin'` explicitly
  - No reliance on client-side permission checks alone

- [ ] **Permission Scope**
  - Impersonated permissions are correctly scoped (no privilege escalation)
  - Admin retains minimal permissions (read/write own User record) during impersonation
  - No way to gain permissions beyond impersonated role

- [ ] **Audit Logging**
  - Impersonation events are logged with sufficient detail
  - Logs are tamper-resistant
  - Logs distinguish between admin and impersonated actions

- [ ] **Error Handling**
  - Invalid roleId returns 403 (not 500)
  - Missing role returns 403 (not 500)
  - Errors do not leak sensitive information

### Threat Modeling

#### Threat: Non-Admin User Gains Impersonation Access
- **Mitigation**: Backend explicitly checks `user.role === 'admin'` before allowing impersonation
- **Test**: Non-admin user calls `/admin/impersonate` → 403

#### Threat: Admin Escalates Privileges via Impersonation
- **Mitigation**: Impersonation only allows assuming LOWER privileges, never higher
- **Test**: Admin cannot impersonate to gain permissions they don't already have

#### Threat: Token Tampering to Change Impersonated Role
- **Mitigation**: JWT signature validation prevents tampering
- **Test**: Modified token fails validation → 401

#### Threat: Impersonation State Persists After Logout
- **Mitigation**: Logout clears localStorage and invalidates token
- **Test**: Logout → re-login → no impersonation active

#### Threat: Impersonation Bypasses Audit Logging
- **Mitigation**: Audit logs record actual user (admin) and impersonation context
- **Test**: Verify logs show admin user ID and impersonated role

#### Threat: Client-Side Permission Checks Bypassed
- **Mitigation**: All permission checks enforced server-side; client UI is convenience only
- **Test**: Modify client state → API requests still fail with 403

---

## Test Data Setup

### Required Test Roles
1. **Admin** - Full permissions (manage all)
2. **Practitioner** - Read/write patients, encounters, prescriptions
3. **Nurse** - Read/write vitals, limited patient access
4. **Receptionist** - Read patients, create appointments, no clinical access
5. **ReadOnly** - Read-only access to most resources
6. **NoPermissions** - Empty role with zero permissions

### Test Users
1. **Admin User** - role: 'admin'
2. **Non-Admin User** - role: 'practitioner'
3. **Deactivated Admin** - role: 'admin', visibilityStatus: 'historical'

---

## Acceptance Criteria

### Must Pass Before Merge
- [ ] All "Critical Security Requirements" tests pass
- [ ] No privilege escalation vulnerabilities
- [ ] No token tampering vulnerabilities
- [ ] Impersonation state correctly managed across sessions
- [ ] Audit logging captures impersonation events
- [ ] Non-admin users cannot access impersonation features
- [ ] Existing functionality not broken (regression tests pass)

### Nice to Have
- [ ] Performance tests show acceptable overhead
- [ ] Accessibility tests pass (keyboard navigation, screen readers)
- [ ] UI/UX is intuitive and clear
- [ ] Documentation updated (if applicable)

---

## Known Limitations & Future Considerations

1. **No Impersonation History**: Currently no UI to show past impersonations (could add audit log viewer)
2. **No Time Limit**: Impersonation persists indefinitely until stopped (could add auto-expire)
3. **No Notification**: Other users don't know when admin is impersonating (could add indicator)
4. **Single Role Only**: Cannot impersonate multiple roles simultaneously (current design)
5. **No Impersonation of Specific Users**: Only role-based, not user-based (current design)

---

## Testing Tools & Commands

### Manual Testing
- Browser: Chrome/Firefox/Safari
- Dev Tools: Network tab, Application tab (localStorage), Redux DevTools

### API Testing
```bash
# Test impersonation endpoint
curl -X POST http://localhost:3000/api/v1/admin/impersonate \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId": "practitioner"}'

# Test stop impersonation
curl -X POST http://localhost:3000/api/v1/admin/impersonate \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId": null}'

# Test roles endpoint
curl http://localhost:3000/api/v1/admin/roles \
  -H "Authorization: Bearer <admin-token>"
```

### Token Inspection
```javascript
// In browser console
const token = localStorage.getItem('apiToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.impersonateRoleId); // Should show impersonated role ID
```

### Log Monitoring
```bash
# Watch server logs for impersonation events
tail -f logs/facility-server.log | grep "Role impersonation"
```

---

## Sign-Off

- [ ] Security review completed
- [ ] All critical tests passed
- [ ] No high-severity vulnerabilities identified
- [ ] Regression tests passed
- [ ] Ready for production deployment

**Tester Name**: _______________  
**Date**: _______________  
**Signature**: _______________
