# Remove black outline from draft guide screenshots

The user and configuration guide format docs no longer call for a black border around screenshots, because the Tamanu Knowledge Base frames images itself. Red outlines stay. The 45 screenshots already published have the border drawn in, so they are trimmed on this card too.

## The rule

- [x] User guide format doc: drop the border point, and outlines keep clear space from the image edge
- [x] Configuration guide format doc: the same
- [x] Configuration guide skill's capture step: drop the black border

These go to main only. Release branches keep their format docs, since the skills run from main.

## Trimming the published images

Every image has a uniform border on all four edges: 2px on most, 4px on the Medications config guide and Vitals user guide shots. No red outline falls inside the border band, so trimming that many pixels from each side removes the border and nothing else. Measure each image's border before trimming rather than assuming the width.

- One image needs padding after the trim: in the Users config guide's Add user dialog (`reference-data-add-user.png`), the Confirm outline sits flush against the bottom border. Add a few pixels of the dialog footer's colour along the bottom so the outline has clear space below it (16px added)
- Two sidebar shots keep only a 1px gap between outline and edge once trimmed: the menu button in Use the sidebar, and the expand-sidebar arrow in Change language. Left as they are by decision; the clear-space rule applies to new captures
- Each `<img>` keeps its displayed scale: reduce its `width` attribute in proportion to the pixels trimmed

## Commits and branches

`release/2.68` holds 10 of the images (Medications and Vitals), byte-identical to main's. `release/2.69`'s guides match main exactly. So the trim is two commits, each with its `width` changes:

1. Medications and Vitals images (10): goes to 2.68, 2.69 and main
2. Every other image (35): goes to 2.69 and main

The card's branch targets main, carrying the rule change and both trim commits. Forward branches are built in temporary worktrees by cherry-picking with subjects unchanged, per `.agents/docs/guide-release-targeting.md`:

- `chore/u14/guide-screenshot-borders-to-2.69`: commits 1 and 2
- `chore/u14/guide-screenshot-borders-to-2.68`: commit 1

2.68's guides still use the older `<p align="center">` image block, so its cherry-pick conflicted on the guide text. Resolved by keeping 2.68's markup and applying only the rescaled widths.

- [x] Trim commit 1
- [x] Trim commit 2
- [ ] Raise the main pull request
- [x] Build the 2.69 and 2.68 branches locally
- [ ] Push the 2.69 and 2.68 branches and raise their pull requests (needs someone with a GitHub login on this machine)
