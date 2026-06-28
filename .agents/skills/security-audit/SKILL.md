---
name: security-audit
description: Review an implementation for common security vulnerabilities (OWASP Top 10 and beyond), grouped by severity, with attention to this codebase's healthcare rules.
---

## Security audit

Review the implementation for security concerns — the OWASP Top 10 and anything else you find. Use judgement about what matters for this code.

For this codebase, pay particular attention to the healthcare/security rules in `llm/project-rules/coding-rules.md`:

- Every API endpoint must enforce real permission checks (`req.ability.can()` + `req.flagPermissionChecked()`) — flag any route that doesn't.
- No patient-identifiable data in logs (INFO level or above), error messages, or stack traces.
- Parameterised queries only — never interpolate user input into SQL.

Post findings grouped by severity, each with a specific file reference.
