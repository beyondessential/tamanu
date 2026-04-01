# 🔒 Security Testing Notes for COOL-52

I've prepared comprehensive testing documentation for the admin impersonation feature. The focus is on security validation to ensure no vulnerabilities are introduced.

## 📄 Documentation

- **Full Testing Guide**: `TESTING_NOTES_COOL_52.md` (396 lines, detailed scenarios)
- **Quick Reference**: `TESTING_NOTES_SUMMARY.md` (concise checklist)
- **Location**: Repository root

## 🎯 Critical Security Tests

### Must Pass Before Approval

1. **Authentication & Authorization**
   - Only `role === 'admin'` can access impersonation endpoints
   - Non-admin users receive 403 Forbidden
   - UI controls only visible to admins

2. **Token Security**
   - JWT properly embeds `impersonateRoleId`
   - Token tampering invalidates signature
   - Refresh/facility switching preserve state

3. **Permission Enforcement**
   - Impersonated permissions enforced server-side
   - `req.ability` reflects impersonated role
   - Admin retains minimal permissions (own User record only)

4. **Role Validation**
   - Cannot impersonate non-existent role
   - Cannot impersonate own role
   - Invalid roleId rejected

5. **Session Management**
   - State survives page refresh
   - Graceful handling of deleted roles
   - Logout clears impersonation

## ⚠️ High-Priority Edge Cases

1. **Token Tampering**: Edit token in localStorage → must fail with 401
2. **Non-Admin Bypass**: Non-admin calls `/admin/impersonate` → must return 403
3. **Permission Escalation**: Verify admin cannot gain permissions beyond target role
4. **Role Deleted Mid-Session**: Delete role while impersonating → graceful recovery
5. **Concurrent Role Switches**: Rapid switching → no race conditions
6. **Zero-Permission Role**: Impersonate empty role → UI shows minimal options
7. **Multiple Browser Tabs**: Separate session states (expected behavior)
8. **Session Timeout**: Logout during impersonation → no state persistence

## 🚨 Security Threat Model

| Threat | Mitigation | Test |
|--------|-----------|------|
| Non-admin gains access | Backend checks `user.role === 'admin'` | Non-admin → 403 |
| Token tampering | JWT signature validation | Modify token → 401 |
| Privilege escalation | Only lowers privileges | Cannot gain new perms |
| State after logout | Logout clears localStorage | Re-login → clean state |
| Audit bypass | Logs admin + impersonation | Verify dual logging |
| Client-side bypass | Server enforces all | Modify Redux → API fails |

## 🧪 Quick Test Commands

```bash
# Start impersonation
curl -X POST http://localhost:3000/api/v1/admin/impersonate \
  -H "Authorization: Bearer <token>" \
  -d '{"roleId": "practitioner"}'

# Stop impersonation
curl -X POST http://localhost:3000/api/v1/admin/impersonate \
  -H "Authorization: Bearer <token>" \
  -d '{"roleId": null}'

# Inspect token (browser console)
const payload = JSON.parse(atob(localStorage.getItem('apiToken').split('.')[1]));
console.log(payload.impersonateRoleId);
```

## 📋 Test Checklist

- [ ] All critical security tests pass
- [ ] No privilege escalation possible
- [ ] Token tampering prevented
- [ ] Non-admin users blocked
- [ ] Audit logging functional
- [ ] Regression tests pass
- [ ] Edge cases handled gracefully

## 🎭 Recommended Test Roles

1. **Admin** - Full permissions (baseline)
2. **Practitioner** - Clinical access
3. **Nurse** - Limited clinical
4. **Receptionist** - No clinical access
5. **ReadOnly** - Read-only
6. **NoPermissions** - Zero permissions (edge case)

## 🔍 Key Implementation Details

### Backend Security
- `/admin/impersonate` checks `user.role === 'admin'` explicitly
- `impersonateRoleId` embedded in JWT payload
- `getAbilityForUser()` builds permissions from impersonated role
- Admin retains read/write on own User record (for settings/logout)
- Logs: `userId`, `action` (start/stop), `impersonateRoleId`

### Frontend Security
- UI controls only render for `currentUser.role === 'admin'`
- Cmd/Ctrl+click on avatar opens impersonation popover
- Visual indicators: red avatar (#f76853), pulsing animation, "(impersonating)" label
- State persisted in localStorage, restored from JWT on refresh

### Token Flow
1. Admin clicks role → calls `/admin/impersonate` with `roleId`
2. Server validates admin role, generates new JWT with `impersonateRoleId`
3. Client stores token, fetches permissions, rebuilds CASL ability
4. All subsequent requests use impersonated permissions
5. Stop: call with `roleId: null`, restore admin permissions

## 🚨 Known Considerations

1. **No Time Limit**: Impersonation persists until stopped (consider auto-expire future)
2. **No History**: No UI for past impersonations (audit logs only)
3. **Single Role**: Cannot impersonate multiple roles simultaneously
4. **No User Impersonation**: Role-based only, not user-specific
5. **Defense in Depth**: Client UI is cosmetic; server enforces everything

## ✅ Acceptance Criteria

**Security**:
- No privilege escalation vulnerabilities
- No token tampering vulnerabilities
- Non-admin users completely blocked
- Audit trail complete

**Functionality**:
- Session management robust
- Permissions correctly enforced
- UI indicators clear
- Regression tests pass

---

**Related PR**: https://github.com/beyondessential/tamanu/pull/9202  
**Testing Docs**: See repository root for full details  
**Prepared**: 2026-04-01
