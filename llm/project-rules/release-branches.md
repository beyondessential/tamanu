# Release Branches - Tamanu

## Finding Release Branches

To check releases, look at the `release/2.xx` branches (e.g., `release/2.41`, `release/2.47`).
The most recent release will be the highest version branch of that form.

Example:

```bash
git branch -r | grep 'release/2\.' | sort -V | tail -5
```
