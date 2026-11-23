---
workhorse-version: 0.8.0
---

# Establishing card context outside Workhorse

Skills are discovered natively by Claude Code, so they can be invoked in an external tool with no Workhorse session around them. Inside Workhorse the system prompt injects the card's context — its title, identifier, and description. Outside it, that context is absent, and a skill that needs to know which card it is working on has to establish that context before doing its work.

Follow this process whenever a skill directs you here.

## When this applies

- Apply it only when you do **not** already have the card's context — no title, identifier, or description available to you. This is the case when you are running outside Workhorse
- Inside Workhorse the card's context is always present, so this process never runs there
- If you already established the card's context earlier in this conversation, reuse it — do not ask again

## Establishing context

When you have no card context, ask the user to establish it before you start the skill's work. Offer two paths:

1. **From the team's tracker** — the user names the card in whatever tracks the team's work, and you read it there. That may be Workhorse itself, read with the Workhorse MCP's `get_card`, or another tracker such as Linear, Jira or GitHub Issues, read through its own MCP. Read whatever detail helps the task at hand — at minimum the card's title and description. If the tracker's MCP is not connected, walk the user through connecting it
2. **Paste** — the user pastes the card's title and description directly into the chat

Also ask the user for the card's **identifier**. It is used for the file paths of mockups (`.workhorse/design/mockups/{card-id}/`), plans (`.workhorse/plans/{card-id}/`), and test cases (`.workhorse/test-cases/{card-id}/`). Every card has one — the tracker's own code supplies it directly. If no ticket backs the work, ask the user to create one in their tracker so the work is tracked; you can offer to create it for them through the tracker's MCP, such as the Workhorse MCP's `create_card`.

## When context is incomplete

If the user cannot or will not supply full context, do the best you can with what is available — ask them for whatever detail they can provide to work from, and proceed on that. Don't block on missing context you can reasonably work around.
