---
status: draft
---

# Sync lookup self-healing

Detect and repair sync_lookup rows that have fallen out of step with their source records — typically after migrations that change data without bumping the sync tick — and block upgrades until the lookup table is verified consistent.
