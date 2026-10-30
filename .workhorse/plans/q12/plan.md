# Sidebar screenshots for the Change your language guide

Adds screenshots to the **After logging in** section of guide 1.3, Change your language
(`docs/user-manuals/desktop/01-accessing-tamanu/03-change-language.md`), showing how to expand the
sidebar and where the three-dot menu button is.

## What the sidebar does

- Collapsed, the sidebar shows the small logo with a right-pointing arrow beside it at the top. The
  user's name and the three-dot button are hidden
- Expanded (the default), the arrow at the top points left and collapses the sidebar. The three-dot
  button sits beside the user's name in the footer
- The three-dot menu holds **Change language** (only when the site has more than one language) and
  **Support centre**

A single image can't show both the expand arrow and the three dots, so the section takes two shots.

## Decisions

- Two shots, each under the step it illustrates
- After step 1: the collapsed sidebar at full height, with the expand arrow outlined in red
- After step 2: the expanded sidebar's footer with the three-dot menu open, with both the three dots
  and **Change language** outlined in red, so the one image covers steps 2 and 3
- Captured on the same demo site as the existing Accessing Tamanu shots (presentation.demos, logged in
  as Initial Admin), matching the crop, border and outline style of `log-in-and-out-log-out.png`

## Display size

At the format's standard width (0.31 times pixel width) the full-height collapsed sidebar comes out
very narrow and tall, and the arrow may be hard to see. Check it in a rendered preview, and if it's too
small, show it larger as was done for the log out shot in guide 1.1.

## Steps

- [ ] Log in to the demo site and collapse the sidebar
- [ ] Capture the collapsed sidebar shot at twice screen resolution, crop, border and outline it
- [ ] Expand the sidebar, open the three-dot menu, and capture the footer shot the same way
- [ ] Show both shots with their proposed outlines for approval
- [ ] Add the approved images to `images/` and the image blocks under steps 1 and 2, with alt text and
      captions
- [ ] Check the guide renders and its image paths resolve
