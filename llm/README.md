# LLM Documentation and Rules

This directory contains documentation and rules for LLM agents working on this project.

## Structure

### `/common-rules` - Shared Generic Rules

Contains generic LLM agent rules that can be shared across multiple projects. These rules are provided via git submodule from the [llm-rules repository](https://github.com/beyondessential/llm-rules).

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
2. If not, use the generic version from `/common-rules/`
3. Always prioritise project-specific rules over generic ones

## Working with the Submodule

### Initial Setup (for new clones)

```bash
# Clone with submodules
git clone --recursive https://github.com/beyondessential/tamanu.git

# Or if already cloned, initialize submodules
git submodule init
git submodule update
```

### Updating Shared Rules

**To update rules in the shared repository:**

```bash
# Make changes in the submodule
cd llm/common-rules
# ... make changes to rules/ ...
git add . && git commit -m "feat: improve rule X"
git push

# Update main project to use the latest
cd ../../
git submodule update --remote llm/common-rules
git add llm/common-rules
git commit -m "deps: update shared LLM rules"
```

**To pull latest shared rules:**

```bash
# Update submodule to latest
git submodule update --remote llm/common-rules
git add llm/common-rules
git commit -m "deps: update to latest shared LLM rules"
```

### Adding New Rules

- **Generic/reusable rules** → Add to [llm-rules repository](https://github.com/beyondessential/llm-rules)
- **Project-specific rules** → Add to `/project-rules`

## Shared Rules Repository

The shared repository contains these rules for use across Tamanu and Tupaia:

- Agent onboarding: `onboard-agent.md` - standardized onboarding flow
- Git workflows: `commit.md`, `create-branch.md`, `rebase-branch.md`
- Documentation: `write-docs.md`, `write-card-description.md`, `create-rule.md`

## Contributing

When adding new rules:

- **Generic/reusable rules** → Add to shared repository
- **Project-specific rules** → Add to `/project-rules`
- Always include Australian/NZ English spelling guidance in Notes sections
