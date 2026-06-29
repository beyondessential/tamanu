---
label: "Handoff"
pill-order:
  not-started: 7
  specifying: 5
  implementing: 6
  reviewing: 6
workhorse-version: 0.1.0
---

## Your task: Hand off to an external agent

The user wants to hand off work on this card to an external agent (Claude Code, Cursor, or another AI tool). Generate the briefing prompt in one pass — do not ask the user to confirm focus first.

### What to do

1. **Infer a focus** from the card's current state and conversation history. For example:
   - Specs are drafted and no code yet → focus is "begin implementation"
   - Implementation is in progress → focus is "continue the implementation"
   - There are CI failures or known bugs → focus is "fix the build failures" or "investigate the reported bug"
2. Compose the briefing prompt and return it in a single fenced code block (use ```markdown). **Critical: the entire prompt must be one copyable block. Do not use fenced code blocks (triple backticks) anywhere inside the prompt — they break the outer fence and prevent copy-paste. Use inline code with single backticks for paths, commands, and identifiers instead.**
3. **Immediately after the code block**, add a short line naming the focus you inferred and inviting the user to redirect — e.g. "This is for starting implementation of the allergies spec. Let me know if you want it for something else."

### Briefing prompt structure

The prompt contains these sections, in order:

**1. Workhorse context** — explain the spec-driven workflow:
- Specs live in `specs/` as structured markdown with YAML frontmatter and checkbox acceptance criteria
- Describe the system as it should be (not changes to make). Acceptance criteria are facts about behaviour. No implementation details in specs
- Mockups live in `.workhorse/design/mockups/d1/` as standalone HTML with inline CSS
- Design system is at `.workhorse/design/design-system.md`
- The card's implementation plan lives at `.workhorse/plans/d1/` — a free-form markdown working document with tech design notes and/or a checklist of build steps. Read it first if it exists, tick items (`- [ ]` → `- [x]`) as work completes, and expand steps into sub-items if they turn out larger than anticipated
- Australian/NZ English spelling

**2. Card context** — the card title, identifier (D1), and description

**3. Branch instructions** — tell the agent which branch to check out and to diff it against the upstream base branch to understand what specs and mockups have been added or changed

**4. Journal summary** — summarise what has happened so far on this card based on the conversation history (what was discussed, what decisions were made, what work was done)

**5. Conversation context** — compress the key points from the conversation: decisions made, open threads, areas explored, any unresolved questions. This gives the external agent continuity

**6. Focus instructions** — what the external agent should do, based on the focus you inferred

### Guidelines

- The prompt should be self-contained — the external agent should not need to ask the user for context
- Teach the agent how to find information (read the specs, diff the branch) rather than inlining all file contents
- Keep it concise but complete — aim for a prompt that gets the external agent productive immediately
- Write it as instructions addressed to the external agent ("You are picking up work on...")
