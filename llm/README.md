# LLM Documentation and Rules

This directory contains documentation and rules for LLM agents working on the Tamanu project.

## Structure

### `/rules` - Shared Generic Rules

Contains generic LLM agent rules that can be shared across multiple projects. These rules are copied from the [llm-rules repository](TODO: Add GitHub URL when repository is hosted).

**To set up as a submodule (when the shared repo is hosted):**

```bash
# Remove the copied directory
rm -rf llm/rules

# Add as submodule
git submodule add https://github.com/[ORG]/llm-rules.git llm/rules
```

### `/rules-tamanu` - Tamanu-Specific Rules

Contains rules that are specific to the Tamanu project, including:

- `translate-hardcoded-strings.md` - Tamanu's TranslatedText system
- `load-initial-context.md` - Tamanu project context loading
- `onboard-bg-agent.md` - Tamanu background agent onboarding
- `update-copy.md` - Tamanu-specific copy update workflows
- `commit.md` - Tamanu's CONTRIBUTING.md requirements
- `create-branch.md` - Linear card integration
- `create-card-description.md` - NZ/Australian culture considerations
- `create-pr.md` - Tamanu PR template integration

### `/docs` - Project Documentation

Contains documentation about Tamanu's codebase for LLM context.

### `/plans` - Development Plans

Contains development plans for complex features.

### `/on-call` - On-Call Documentation

Contains on-call and operational documentation.

## Usage

When an LLM agent needs to follow a rule:

1. First check if there's a Tamanu-specific version in `/rules-tamanu`
2. If not, use the generic version from `/rules`
3. Always prioritise project-specific rules over generic ones

## Shared Rules Repository

The generic rules in `/rules` are maintained in a separate repository to enable sharing across multiple projects. When making changes:

1. **For generic improvements**: Update the shared repository
2. **For Tamanu-specific changes**: Update files in `/rules-tamanu`

The shared repository contains these generic rules:

- Documentation: `create-context.md`, `create-docs.md`, `create-plan.md`, `create-rule.md`, `create-on-call-doc.md`
- Updates: `update-context.md`, `update-docs.md`, `update-on-call-doc.md`, `update-plan.md`, `update-rule.md`
- Git workflows: `commit.md`, `create-branch.md`, `create-pr.md`, `create-card-description.md`, `rebase-branch.md`

## Contributing

When adding new rules:

- **Generic/reusable rules** → Add to shared repository
- **Tamanu-specific rules** → Add to `/rules-tamanu`
- Always include Australian/NZ English spelling guidance in Notes sections
