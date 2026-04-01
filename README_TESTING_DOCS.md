# Testing Documentation for COOL-52 Admin Impersonation

This directory contains comprehensive security testing documentation for the admin impersonation feature (COOL-52).

## 📁 Files Created

### 1. `TESTING_NOTES_COOL_52.md` (Full Documentation)
**Purpose**: Complete testing guide with detailed scenarios  
**Length**: 396 lines  
**Audience**: QA engineers, security reviewers, developers

**Contents**:
- Critical security requirements (authentication, token security, permissions)
- Functional testing workflows (start/stop impersonation)
- Edge cases (50+ scenarios)
- Security audit checklist
- Threat modeling
- Performance considerations
- Test data setup requirements
- Acceptance criteria

**Use this for**: Thorough security review and comprehensive testing

---

### 2. `TESTING_NOTES_SUMMARY.md` (Quick Reference)
**Purpose**: Concise checklist for rapid testing  
**Length**: 163 lines  
**Audience**: Developers, quick reviews

**Contents**:
- Critical security tests (checklist format)
- High-priority edge cases
- Security threat model (table)
- Quick test commands
- Acceptance criteria

**Use this for**: Quick validation before merge, daily testing

---

### 3. `LINEAR_COMMENT.md` (Issue Comment)
**Purpose**: Ready-to-paste comment for Linear issue  
**Length**: 147 lines  
**Audience**: Product managers, stakeholders

**Contents**:
- Executive summary of security tests
- High-priority edge cases
- Quick test commands
- Key implementation details
- Acceptance criteria

**Use this for**: Copy-paste into COOL-52 Linear issue

---

## 🎯 How to Use These Documents

### For QA/Security Review
1. Start with `TESTING_NOTES_COOL_52.md`
2. Work through each section systematically
3. Check off items as you test
4. Document any failures or concerns
5. Ensure all "Critical Security Requirements" pass

### For Quick Validation
1. Use `TESTING_NOTES_SUMMARY.md`
2. Run through the test checklist
3. Execute quick test commands
4. Verify no regressions

### For Stakeholder Communication
1. Copy contents of `LINEAR_COMMENT.md`
2. Paste into Linear issue COOL-52 as a comment
3. Update checklist as testing progresses
4. Reference for approval discussions

---

## 🔒 Security Focus Areas

### Highest Priority (Must Pass)
1. **Non-Admin Access Prevention**: Non-admin users cannot access impersonation
2. **Token Tampering Prevention**: JWT signature validation prevents manipulation
3. **Permission Enforcement**: Server-side enforcement, no client-side bypass
4. **Privilege Escalation Prevention**: Cannot gain permissions beyond target role
5. **Session Management**: Proper state handling across refresh/logout

### Medium Priority (Should Pass)
6. Role validation (non-existent, deleted, invalid roles)
7. Edge cases (concurrent switches, multiple tabs, timeouts)
8. UI/UX indicators (visual feedback, accessibility)
9. Audit logging (complete trail of impersonation events)
10. Performance (acceptable overhead, no N+1 queries)

---

## 🧪 Quick Start Testing

### Prerequisites
- Admin user account
- Multiple test roles (Practitioner, Nurse, Receptionist, ReadOnly)
- Non-admin user account
- Access to server logs

### Basic Test Flow (5 minutes)
1. **Login as admin** → verify full permissions
2. **Cmd/Ctrl+click avatar** → popover appears
3. **Select "Practitioner" role** → UI updates, avatar pulses
4. **Navigate to restricted page** → verify limited access
5. **Cmd/Ctrl+click avatar** → click "Stop impersonating"
6. **Verify admin permissions restored**

### Security Test Flow (10 minutes)
1. **Login as non-admin** → verify no impersonation UI
2. **Attempt API call** to `/admin/impersonate` → verify 403
3. **Login as admin, start impersonation**
4. **Open browser DevTools** → edit token in localStorage
5. **Make API request** → verify 401 (invalid signature)
6. **Restore valid token, refresh page** → verify state restored
7. **Check server logs** → verify impersonation events logged

---

## 📊 Test Coverage

### Security Tests
- ✅ Authentication & Authorization (5 tests)
- ✅ Token Security (4 tests)
- ✅ Permission Enforcement (4 tests)
- ✅ Role Validation (4 tests)
- ✅ Session Management (4 tests)

### Functional Tests
- ✅ Basic workflow (3 scenarios)
- ✅ Edge cases (14 scenarios)
- ✅ UI/UX (4 scenarios)
- ✅ Backend security (3 scenarios)

### Regression Tests
- ✅ Normal admin login/logout
- ✅ Non-admin user workflows
- ✅ Token refresh & facility switching
- ✅ Existing permission checks

**Total**: 45+ test scenarios documented

---

## 🚨 Critical Vulnerabilities to Prevent

| Vulnerability | Impact | Mitigation |
|--------------|--------|------------|
| Non-admin impersonation | **CRITICAL** | Backend role check |
| Token tampering | **CRITICAL** | JWT signature validation |
| Privilege escalation | **CRITICAL** | Permission scope enforcement |
| Session hijacking | **HIGH** | Token expiry, secure storage |
| Audit log bypass | **HIGH** | Mandatory logging |
| Client-side bypass | **MEDIUM** | Server-side enforcement |

---

## 📝 Reporting Issues

If you find security issues during testing:

1. **DO NOT** post in public channels
2. **DO** report directly to security team
3. **Include**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Impact assessment (Critical/High/Medium/Low)
   - Suggested fix (if applicable)

---

## ✅ Sign-Off Checklist

Before approving COOL-52 for production:

- [ ] All critical security tests pass
- [ ] No privilege escalation possible
- [ ] Token tampering prevented
- [ ] Non-admin users blocked
- [ ] Audit logging functional
- [ ] Regression tests pass
- [ ] Edge cases handled gracefully
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Security review completed

---

## 🔗 Related Links

- **PR**: https://github.com/beyondessential/tamanu/pull/9202
- **Linear Issue**: COOL-52
- **Security Documentation**: `/workspace/llm/docs/authentication.md`

---

## 📞 Questions?

For questions about these testing docs:
- Review the full `TESTING_NOTES_COOL_52.md` for detailed explanations
- Check PR #9202 for implementation details
- Consult security team for vulnerability concerns

---

**Created**: 2026-04-01  
**Last Updated**: 2026-04-01  
**Version**: 1.0
