# Prompt-builder backward compatibility test cases

Scenarios run against `packages/central-server/__tests__/ai/promptProtocol.test.js`.

## Breaking changes fail

- [x] Renaming a summary delimiter tag fails for every context that emits it
- [x] Renaming a form builder marker fails for every context that emits it
- [x] Renaming a structured-output field fails for the context bound to that schema
- [x] Removing a tweak operation type (a literal value in the discriminated union) fails for the tweak context
- [x] Removing a whole AI context from `AI_CONTEXT_NAMES` fails for every token it had in the ledger

## Compatible and acknowledged changes

- [x] A renamed token passes once the new token is active and the old one is in `removed` with `removedIn` and `reason`
- [x] A new token fails until it is added to the ledger's `active` list, with a message saying the addition is compatible
- [x] A `removed` entry without an x.y.z `removedIn` or a reason fails
- [x] A token listed as both active and removed fails
- [x] A ledger entry missing its `active` or `removed` list is treated as empty, not a crash
- [x] A context in `AI_CONTEXT_NAMES` with no `AI_PROMPT_PROTOCOL` entry fails with a message naming it, not a crash

## Uploaded content cannot forge markers

- [x] Protocol markers inside uploaded file text are stripped before it reaches the model
- [x] Protocol markers inside the model's interpretation of an uploaded image or PDF are stripped, while the admin's own `[PROGRAM SELECTED]` is kept

## Refactor preserves output

- [x] Summary user messages are byte-identical to the pre-refactor builder, including tag stripping and dropped half-pairs
- [x] Existing central-server form builder and AI summary suites pass
- [ ] Manual: the AI form builder chat with a program selected still sends `[PROGRAM SELECTED] <code>` and the model attaches to that program
