# Agent: Design & Architecture

Focus on high-level design and architecture decisions.

Things to look for:
- Overall structure: does the way concepts are grouped make sense? Single responsibility per class/function/module?
- Early/wrong abstractions — generalisation without evidence it's needed
- Incidental changes to widely-used components — would a new purpose-built one be better?
- Separation of concerns, file organisation, breaking changes to shared interfaces
- DRY violations (significant, not trivial)
- Over-engineering: unnecessary abstractions, excessive configuration, feature flags, or error handling for scenarios that can't happen. AI-generated code is especially prone to this — flag anywhere the PR does more than what's needed

Ignore: performance, correctness, security, naming/readability conventions, project-specific rules, linter-caught style.
