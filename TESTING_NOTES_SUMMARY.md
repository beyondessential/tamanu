# Testing Notes Summary for COOL-52

**Full testing documentation**: See `TESTING_NOTES_COOL_52.md` in repository root

---

## 🔒 Critical Security Tests (Must Pass)

### Authentication & Authorization
- ✅ Only `role === 'admin'` users can access `/admin/impersonate` and `/admin/roles` endpoints
- ✅ Non-admin users receive 403 Forbidden when attempting impersonation
- ✅ Impersonation UI only visible to admin users
- ✅ Client-side manipulation cannot bypass server-side checks

### Token Security
- ✅ `impersonateRoleId` properly embedded in JWT and validated
- ✅ Token tampering invalidates signature
- ✅ Token refresh and facility switching preserve impersonation state
- ✅ Token expiry and renewal work correctly during impersonation

### Permission Enforcement
- ✅ Impersonated role permissions enforced on ALL API requests
- ✅ Server-side `req.ability` reflects impersonated role, not admin
- ✅ UI permission checks (CASL) reflect impersonated role
- ✅ Admin retains minimal permissions (read/write own User record) during impersonation

### Role Validation
- ✅ Cannot impersonate non-existent role (403)
- ✅ Cannot impersonate own role (403)
- ✅ Invalid roleId rejected
- ✅ Stopping impersonation (roleId: null) restores admin permissions

### Session Management
- ✅ Impersonation survives page refresh
- ✅ Deleted role during impersonation handled gracefully
- ✅ Stale tokens fall back to admin permissions
- ✅ Logout clears impersonation state

---

## ⚠️ Key Edge Cases to Test

### High Priority
1. **Token Tampering**: Manually edit token in localStorage → should fail with 401
2. **Non-Admin Bypass**: Non-admin user calls `/admin/impersonate` → must return 403
3. **Permission Escalation**: Admin impersonating cannot gain permissions beyond target role
4. **Role Deleted Mid-Session**: Delete role while admin impersonating it → graceful recovery
5. **Concurrent Role Switches**: Rapidly switch between roles → no race conditions

### Medium Priority
6. **Multiple Browser Tabs**: Impersonation in one tab doesn't affect others (separate sessions)
7. **Session Timeout**: Timeout during impersonation → logout gracefully, no state persistence
8. **Facility Switching**: Switch facilities while impersonating → state preserved correctly
9. **Zero-Permission Role**: Impersonate role with no permissions → UI shows minimal options
10. **Token Refresh**: Call `/refresh` during impersonation → impersonation preserved

### UI/UX
11. **Visual Indicators**: Avatar turns red, pulses, shows "(impersonating)" label
12. **Popover Behavior**: Opens on Cmd/Ctrl+click, closes on selection, shows active role
13. **Role List**: Alphabetically sorted, excludes admin's own role, highlights active
14. **Stop Button**: Only visible when actively impersonating

---

## 🎯 Security Threat Model

| Threat | Mitigation | Test |
|--------|-----------|------|
| Non-admin gains impersonation | Backend checks `user.role === 'admin'` | Non-admin calls endpoint → 403 |
| Token tampering | JWT signature validation | Modify token → 401 |
| Privilege escalation | Impersonation only lowers privileges | Admin cannot gain new permissions |
| State persistence after logout | Logout clears localStorage + token | Logout → re-login → no impersonation |
| Audit log bypass | Logs record admin user + impersonation context | Verify logs show both IDs |
| Client-side bypass | All permissions enforced server-side | Modify Redux state → API still fails |

---

## 📋 Test Checklist

### Before Approval
- [ ] All "Critical Security Tests" pass
- [ ] No privilege escalation possible
- [ ] Token tampering prevented
- [ ] Non-admin users blocked from impersonation
- [ ] Audit logging captures impersonation events
- [ ] Existing functionality not broken (regression tests)

### Recommended Test Roles
1. **Admin** - Full permissions
2. **Practitioner** - Read/write patients, encounters
3. **Nurse** - Limited clinical access
4. **Receptionist** - No clinical access
5. **ReadOnly** - Read-only access
6. **NoPermissions** - Zero permissions (edge case)

---

## 🧪 Quick Test Commands

### API Testing
```bash
# Start impersonation
curl -X POST http://localhost:3000/api/v1/admin/impersonate \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId": "practitioner"}'

# Stop impersonation
curl -X POST http://localhost:3000/api/v1/admin/impersonate \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId": null}'
```

### Token Inspection (Browser Console)
```javascript
const token = localStorage.getItem('apiToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.impersonateRoleId);
```

### Log Monitoring
```bash
tail -f logs/facility-server.log | grep "Role impersonation"
```

---

## 🚨 Known Security Considerations

1. **Audit Trail**: Impersonation events logged with `userId`, `action`, `impersonateRoleId`
2. **Defense in Depth**: Client UI changes are cosmetic; server enforces all permissions
3. **Minimal Admin Retention**: During impersonation, admin only retains read/write on own User record
4. **No Time Limit**: Impersonation persists until explicitly stopped (consider adding auto-expire in future)
5. **Single Role Only**: Cannot impersonate multiple roles simultaneously (by design)

---

## ✅ Acceptance Criteria

**Must Pass**:
- No privilege escalation vulnerabilities
- No token tampering vulnerabilities
- Non-admin users completely blocked
- Audit logging functional
- Session management robust
- Regression tests pass

**Nice to Have**:
- Performance overhead acceptable
- Accessibility (keyboard navigation, screen readers)
- Clear, intuitive UI/UX

---

## 📄 Related Files

- **Full Testing Notes**: `/TESTING_NOTES_COOL_52.md`
- **PR**: https://github.com/beyondessential/tamanu/pull/9202
- **Linear Issue**: COOL-52

**Prepared by**: AI Agent  
**Date**: 2026-04-01
