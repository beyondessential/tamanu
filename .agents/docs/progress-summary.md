---
workhorse-version: 0.8.0
---

# The progress summary

A card's progress summary sits on the card's home and tells people who were not in its conversations where the work stands. A skill that ends a stage of work finishes by bringing it up to date.

1. Read the current summary with `get_card`, and the comments posted since its `readThrough` with `list_comments` (`since`), so decisions made in the discussion are not missed.
2. Revise it with `revise_progress`, passing back the `readAt` that `get_card` reported, carrying over the sections this stage did not change, with a one-line note on what changed.
3. Tell the user in a line what you recorded. They can edit it from the card home.

Skip it when nothing has changed since the summary was last revised, and where the tools are not available.

Write it for someone glancing at the card: where it stands, the decisions condensed, and what is left, with no history of how the work went.
