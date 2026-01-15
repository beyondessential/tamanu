# Tamanu - Development Guidelines for AI Assistants

This file contains rules and patterns that AI assistants should follow when working on this codebase.

## Project-Specific Rules

See `llm/project-rules/` for detailed Tamanu-specific rules:

- **Pull Requests**: See @llm/project-rules/pull-requests.md for PR template usage
- **Release Branches**: See @llm/project-rules/release-branches.md for finding releases
- **Configuration Guides**: See @llm/project-rules/write-config-guides.md for creating config and usage documentation
- **Important Rules**: See @llm/project-rules/important-project-rules.md for coding preferences and conventions
- **Copy Changes**: See @llm/project-rules/update-copy.md for TranslatedText system and copy update workflows
- **Translate Strings**: See @llm/project-rules/translate-hardcoded-strings.md for internationalization

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
- **On-Call**: See @llm/docs/on-call-cheatsheet.md for operations and troubleshooting

## Additional Resources

- See @README for project overview
- See @package.json for available npm commands for this project
- See @packages/database/CLAUDE.md for database and migration patterns
