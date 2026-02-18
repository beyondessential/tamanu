# Agent: Design & Architecture

Focus on high-level design and architecture decisions.

Read `llm/project-rules/coding-rules.md` for the team's design principles — especially the Code Design section.

Things to look for:
- Overall structure: does the way concepts are grouped make sense? Single responsibility per class/function/module?
- Early/wrong abstractions — generalisation without evidence it's needed. Wrong abstractions are worse than duplication.
- Incidental changes to widely-used components — would a new purpose-built one be better?
- Chesterton's Fence: changes to existing patterns without understanding why they exist
- Separation of concerns, file organisation, breaking changes to shared interfaces
- DRY violations (significant, not trivial)
- Defensive null checks in internal code as a design smell — fix the caller, not the callee

Ignore: performance, correctness, security, naming/readability conventions, linter-caught style.
