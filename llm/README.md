# LLM Documentation and Rules

This directory contains documentation and rules for LLM agents working on this project.

## Structure

### `/common-rules` - Shared Generic Rules

Contains generic LLM agent rules that can be shared across multiple projects. These rules are copied from the [llm-rules repository](TODO: Add GitHub URL when repository is hosted).

**To set up as a submodule (when the shared repo is hosted):**

```bash
# Remove the copied directory
rm -rf llm/common-rules

# Add as submodule
git submodule add https://github.com/[ORG]/llm-rules.git llm/common-rules
```

### `/project-rules` - Project-Specific Rules

Contains rules that are specific to this project, including:

- `important-project-rules.md` - Essential project information and conventions
- `translate-hardcoded-strings.md` - Project's TranslatedText system (if applicable)
- `update-copy.md` - Project-specific copy update workflows

### `/docs` - Project Documentation

Contains documentation about the project's codebase for LLM context.

### `/plans` - Development Plans

Contains development plans for complex features.

### `/on-call` - On-Call Documentation

Contains on-call and operational documentation.

## Usage

When an LLM agent needs to follow a rule:

1. First check if there's a project-specific version in `/project-rules`
2. If not, use the generic version from `/common-rules`
3. Always prioritise project-specific rules over generic ones

## Shared Rules Repository

The generic rules in `/common-rules` are maintained in a separate repository to enable sharing across multiple projects. When making changes:

1. **For generic improvements**: Update the shared repository
2. **For project-specific changes**: Update files in `/project-rules`

The shared repository contains these rules for use across Tamanu and Tupaia:

- Agent onboarding: `onboard-agent.md` - standardized onboarding flow
- Git workflows: `commit.md`, `create-branch.md`, `rebase-branch.md`
- Documentation: `write-docs.md`, `write-card-description.md`, `create-rule.md`

## Contributing

When adding new rules:

- **Generic/reusable rules** → Add to shared repository
- **Project-specific rules** → Add to `/project-rules`
- Always include Australian/NZ English spelling guidance in Notes sections
