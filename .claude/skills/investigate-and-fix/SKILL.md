---
name: investigate-and-fix
description: Diagnose and fix a bug described on a ticket — locate the cause, state the diagnosis before coding, then apply the fix.
---

## Investigate and fix

The ticket describes a bug. Diagnose the cause and apply the fix.

1. **Read the ticket** — title, description, reproduction steps, error messages, attachments. Treat these as the report.
2. **Locate the code path** — use the specs in `docs/specs/<area>/` to understand the intended behaviour, then find the code that implements (or should implement) it.
3. **Form a diagnosis** — what the code currently does, what it should do, and why they diverge. State this before touching code so the user can agree or redirect.
4. **Apply the fix** — edit the code so it matches the intended behaviour.
5. **Decide about the spec** — bug fixes usually don't need spec updates, but if the bug existed because the spec was unclear, wrong, or missing, update the spec first then fix the code to match (see `.claude/skills/shared/spec-format.md`).
6. **Summarise** the diagnosis and the fix — short, specific, with file references.

If the description is too thin to diagnose confidently, ask for the missing reproduction details before guessing.
