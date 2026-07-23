<!-- BEGIN:workhorse 0.2.0 -->
# Workhorse framework

This workspace uses [Workhorse](https://github.com/beyondessential/workhorse), a spec-driven development workbench. Workhorse ships skills (invokable prompts) and reference docs into this repo to shape how AI agents work here.

- **Skills** live at `.agents/skills/` — each skill is a folder containing a `SKILL.md` with YAML frontmatter and a prompt body. `.claude/skills/` is a symlink to the same folder so Claude Code picks them up natively
- **Reference docs** live at `.agents/docs/` — long-form guidance that skill bodies cite by path (spec format conventions and similar)
- **Specs** live at `specs/` — acceptance criteria for each piece of work, organised into areas by subdirectory

When picking up a task, read the skill whose folder name matches what you're being asked to do — its `SKILL.md` describes how to approach the work and which reference docs to follow.

Workhorse keeps this section, the skills, and the reference docs current automatically: the first agent turn of a session smart-merges the latest release over your local edits, so your deliberate changes survive. Edit or remove it freely.
<!-- END:workhorse -->

# Tamanu - Development Guidelines for AI Assistants

This file contains rules and patterns that AI assistants should follow when working on this codebase.

## Project-Specific Rules

See `llm/project-rules/` for detailed Tamanu-specific rules:

- **Git Workflow**: See @llm/project-rules/git-workflow.md for branch naming, commit format, and allowed conventional types
- **Pull Requests**: See @llm/project-rules/pull-requests.md for PR template usage and conventional commit types
- **Release Branches**: See @llm/project-rules/release-branches.md for finding releases
- **Configuration Guides**: See @llm/project-rules/write-config-guides.md for creating config and usage documentation
- **Important Rules**: See @llm/project-rules/important-project-rules.md for coding preferences and conventions
- **Coding Rules**: See @llm/project-rules/coding-rules.md for domain-specific rules and antipatterns
- **Copy Changes**: See @llm/project-rules/update-copy.md for TranslatedText system and copy update workflows
- **Translations**: See @llm/project-rules/translations.md for the TranslatedText / TranslatedEnum / TranslatedReferenceData system and string ID conventions
- **Sequelize Transactions**: See @llm/project-rules/sequelize-transactions.md for managed transactions and CLS (do not pass transaction object)
- **Settings**: See @llm/project-rules/settings.md for the settings schemas, reading settings (central vs facility readers), and why new config belongs in settings rather than config files
- **Endpoint (integration) tests**: See @llm/project-rules/endpoint-integration-tests.md for central/facility HTTP route tests (supertest, auth, CRUD, validation)
- **Playwright E2E**: See @llm/project-rules/playwright-e2e.md for E2E test structure, page objects, and Playwright best practices (`packages/e2e-tests`)

## Common Rules (Shared Across Projects)

See `llm/common-rules/` for generic LLM agent rules (from shared submodule):

- **Git Workflows**: See @llm/common-rules/commit.md, @llm/common-rules/create-branch.md, @llm/common-rules/rebase-branch.md
- **Documentation**: See @llm/common-rules/write-docs.md, @llm/common-rules/write-card-description.md
- **Agent Onboarding**: See @llm/common-rules/onboard-agent.md for standardized onboarding flow
- **Rule Management**: See @llm/common-rules/create-rule.md, @llm/common-rules/update-submodule.md, @llm/common-rules/get-latest-rules.md

## Project Documentation

See `llm/docs/` for project-specific documentation:

- **Overview**: See @llm/docs/initial-overview.md for codebase architecture
- **Authentication**: See @llm/docs/authentication.md for auth system details
- **On-Call**: See @docs/README.md for the support pack (operations and troubleshooting runbooks, SOPs, and reference)

## Writing Rules and Prompts

When writing or updating LLM rules (`llm/`), prompts (`.github/review-hero/prompts/`), or similar instructions:

- Keep it concise — don't overexplain things the agent already knows how to do
- Don't repeat information that exists in other rule files; reference them instead
- Don't instruct agents to use specific tools (e.g. "use the Read tool") — they know their tools
- State _what_ to check, not _how_ to check it

## Additional Resources

- See @README for project overview
- See @package.json for available npm commands for this project
- See @packages/database/CLAUDE.md for database and migration patterns
