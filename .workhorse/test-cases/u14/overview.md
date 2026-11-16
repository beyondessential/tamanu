# Test cases: remove black outline from guide screenshots

## Rule

- [ ] Neither format doc nor either guide skill calls for a border around a screenshot
- [ ] Both format docs still call for red outlines, with clear space from the image edge

## Trimmed images

- [ ] Every image under `docs/user-manuals/` has no dark border band on any edge
- [ ] Each trimmed image is its original size minus the border on each side, with nothing else cropped
- [ ] No red outline is cut short by the trim
- [ ] The Add user dialog shot has clear space below the Confirm outline, in the footer's colour
- [ ] Each image displays at the same scale as before in its guide

## Branches

- [ ] Main, `release/2.69` and `release/2.68` each hold border-free versions of every guide image they carry
- [ ] The forward branches' commits carry the same subjects as main's
- [ ] Each guide renders its images correctly on the Knowledge Base after publishing
