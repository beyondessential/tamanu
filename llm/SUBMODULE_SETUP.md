# Setting Up LLM Rules as a Submodule

This guide explains how to convert the copied `/common-rules` directory into a proper git submodule once the shared repository is hosted.

## Prerequisites

1. The shared `llm-rules` repository must be hosted on GitHub or another git hosting service
2. You have access to push the `/tmp/llm-rules` content to that hosted repository

## Step 1: Push Shared Repository

```bash
# Navigate to the shared repository
cd /tmp/llm-rules

# Add remote origin (replace with actual repository URL)
git remote add origin https://github.com/[ORG]/llm-rules.git

# Push to main branch
git push -u origin main
```

## Step 2: Convert to Submodule

```bash
# Navigate to Tamanu repository
cd /path/to/tamanu

# Remove the copied rules directory
rm -rf llm/common-rules

# Remove from git if still tracked
git rm -r --cached llm/common-rules 2>/dev/null || true

# Add as submodule
git submodule add https://github.com/[ORG]/llm-rules.git llm/common-rules

# Commit the submodule
git add .gitmodules llm/common-rules
git commit -m "repo: convert LLM rules to submodule

- Replace copied rules with submodule reference
- Enable sharing of generic rules across projects"
```

## Step 3: Update README

Update the TODO in `llm/README.md` to point to the actual hosted repository URL.

## Working with the Submodule

### Updating rules in the shared repository:

```bash
# Make changes in the submodule
cd llm/common-rules
# ... make changes ...
git add . && git commit -m "feat: improve rule X"
git push

# Update Tamanu to use the latest
cd ../../
git submodule update --remote llm/common-rules
git add llm/common-rules
git commit -m "deps: update shared LLM rules"
```

### When cloning Tamanu with submodules:

```bash
git clone --recursive https://github.com/[ORG]/tamanu.git

# Or if already cloned:
git submodule init
git submodule update
```

## Benefits

- ✅ Generic rules shared across multiple projects
- ✅ Project-specific rules remain in main repository
- ✅ Version control for rule updates
- ✅ Clear separation of concerns
