# Test cases: remove black outline from guide screenshots

## Rule

- [x] Neither format doc nor either guide skill calls for a border around a screenshot
- [x] Both format docs still call for red outlines, with clear space from the image edge

## Trimmed images

- [x] Every image under `docs/user-manuals/` has no dark border band on any edge
- [x] Each trimmed image is its original size minus the border on each side, with nothing else cropped
- [x] No red outline is cut short by the trim
- [x] The Add user dialog shot has clear space below the Confirm outline, in the footer's colour
- [x] Each image displays at the same scale as before in its guide

## Branches

- [ ] Main, `release/2.69` and `release/2.68` each hold border-free versions of every guide image they carry
- [x] The forward branches' commits carry the same subjects as main's
- [ ] Each guide renders its images correctly on the Knowledge Base after publishing
