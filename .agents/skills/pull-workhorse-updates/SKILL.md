---
name: pull-workhorse-updates
description: "Pull the current Workhorse release's skills, reference docs, and AGENTS.md framework section onto this card, smart-merging against local edits"
label: "Pull Workhorse updates"
pill-order:
  not-started: 9
  specifying: 14
  implementing: 8
  reviewing: 8
  complete: 5
jockey-hint: "Low-traffic maintenance action — surface as an available pill, not a top suggestion. Only promote when the user explicitly asks to pull or update Workhorse's skills, docs, or framework files."
workhorse-version: 0.1.0
---

## Your task: Pull Workhorse updates

Bring this workspace's Workhorse framework files up to the current release, smart-merging the new bundle against any local edits. The managed files are the **skills** under `.agents/skills/`, the **reference docs** under `.agents/docs/`, and the **framework section** at the top of `AGENTS.md`. The design library under `.workhorse/design/` is workspace-owned and out of scope — never touch it here.

Workhorse has materialised the current release's bundle into `.workhorse/.pull-bundle/` in this worktree so you can read it directly. That folder is the source of the new versions ("theirs"); the files already in the workspace are "ours". The folder carries its own `.gitignore` so nothing under it is committed — do not merge it into the repo, and leave the folder for Workhorse to manage.

### What's in the bundle folder

- `.workhorse/.pull-bundle/manifest.json` — the authoritative list of managed files. Each entry has the target path (relative to the repo root) and the current bundle version. Read this first
- `.workhorse/.pull-bundle/skills/{folder}/SKILL.md` — the current version of each shipped skill
- `.workhorse/.pull-bundle/docs/{name}.md` — the current version of each shipped reference doc
- `.workhorse/.pull-bundle/AGENTS.section.md` — the current framework section, wrapped in its `<!-- BEGIN:workhorse <version> -->` / `<!-- END:workhorse -->` markers

### Identifying what's managed

- A skill's `SKILL.md` or a reference doc is Workhorse-shipped only if it carries a `workhorse-version` frontmatter field. A file without that field is a purely local file — never touch it
- The `AGENTS.md` framework section is the region between the `<!-- BEGIN:workhorse ... -->` and `<!-- END:workhorse -->` markers. Everything else in `AGENTS.md` is user-owned — never touch it
- A file's identity is its path (the skill folder name, or the doc filename). If a user has renamed or moved a shipped file, it has detached from the bundle — treat it as local and leave it

### Procedure

Work through every entry in the manifest, then check for removals:

1. **New file** — a manifest entry with no counterpart in the workspace. Copy the bundle version into its target path verbatim, including its `workhorse-version` frontmatter
2. **Unchanged local file** — the workspace copy is identical to the bundle version except for a lower `workhorse-version`. Replace it with the bundle version (this just bumps the version)
3. **Locally edited file** — the workspace copy differs from the bundle version in more than the `workhorse-version`. Smart-merge: take the bundle version as the new baseline and re-apply the user's local intent on top, so the release's improvements land while the user's deliberate edits survive. Set `workhorse-version` to the bundle's version. Read both files fully and reason about intent — do not do a naive line union
4. **Removed file** — a workspace file that carries a `workhorse-version` but has no manifest entry (its path is no longer shipped). Delete it with `rm <path>`. The user reviews the deletion in the PR and can revert it there to keep it as a local fork
5. **AGENTS.md framework section** — merge the marked region the same way: bundle section as baseline, the user's edits within the region re-applied on top, written back between the markers with the marker version bumped. If `AGENTS.md` has no Workhorse markers yet, insert the bundle section at the very top of the file. If `AGENTS.md` doesn't exist, create it containing just the section
6. **`.claude/skills/` symlink** — confirm it exists and points at `../.agents/skills/`. If it's missing or points elsewhere, recreate it. If a real file or directory sits at that path instead of a symlink, leave it alone and note it

### Conflicts and reporting

- Apply straightforward merges directly. Where a merge is genuinely ambiguous — the release and the local edit change the same thing in incompatible ways — stop and ask the user how to resolve it rather than guessing
- When every managed file already matches the current bundle version, make no changes and report that the workspace is already up to date
- Summarise what you did: files added, updated (noting which needed a real merge), and removed; whether the AGENTS.md section changed; and any conflicts you surfaced

Your changes are committed to this card's branch by the normal auto-commit, and the user reviews them through this card's PR.
