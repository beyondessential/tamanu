---
id: CPLAN
---

# Care plans

Applies to the care plans recorded against a patient and listed in the patient sidebar: adding one from a template, its problem list, the notes added to it, and its change log.

## Care plans in the patient sidebar

- The Care plans section of the patient sidebar lists each care plan the patient has, by name.
- Selecting a care plan opens it in the care plan modal.
- Add opens the Add care plan form.
- A patient has any one care plan at most once.

## Adding a care plan

- The Add care plan form has Care plan, Template, Date recorded, Clinician, Problem list and Main care plan fields.
- Care plan and Main care plan are required. The rest are optional.
- Care plan offers only the care plans the patient does not already have.
- Date recorded starts at the current date and time.
- The clinician chosen is recorded as the person the main care plan was written on behalf of.
- The Problem list field sits to the left of the Main care plan field, as the two appear on the saved care plan.
- Saving with a required field empty keeps the form open, outlines each empty required field as an error, and shows "*Required" beneath it.
- The error message sits below its field without changing the field's height, so the Problem list and Main care plan fields stay aligned.
- Add saves the care plan, closes the form, and lists the care plan in the sidebar.
- Cancel, or closing the form, discards what was entered.

### Templates

- Template is available once a care plan has been chosen, and offers only the templates linked to that care plan.
- Choosing a template replaces the Main care plan text and the problem list with the template's.
- Changing the care plan clears the chosen template and leaves the text and problem list as they are.
- Clearing the template leaves the text and problem list as they are.
- A care plan template is set up in the admin panel's templates. Each is linked to one care plan, and holds the main care plan text and the problem list items.

> [!NOTE]
> Replacing the content when a template is chosen follows note templates, so a template behaves the same way wherever a clinician meets one.

### Writing the problem list

- Add item adds an empty item at the end of the list and places the cursor in it.
- Pressing Enter in an item adds an empty item below it.
- Pressing Backspace in an empty item removes it.
- Each item can be removed, and can be ticked while it is being written.
- An item's text wraps onto further lines rather than being cut off.
- Empty items are dropped when the form is saved.

## The care plan modal

- The modal is titled "Care plan:" followed by the care plan's name.
- It shows the main care plan first, then the care plan's notes from oldest to newest, then the form for adding a note, separated from the notes by a divider.
- The modal's footer holds a single Close, which closes the modal.
- Text on the cards and in the change log wraps within its own column, breaking a word too long for the column, so no text runs into the column beside it.

> [!NOTE]
> Notes run oldest first so a note appears directly above the form it was written in.

### The main care plan

- The main care plan's card is headed "Main care plan", with its author, who it was written on behalf of, and its date recorded beneath the heading.
- A main care plan with a problem list shows the list to the left of its text, under the heading Problem list, with a count of the items ticked out of the total.
- A main care plan without a problem list shows its text alone.

### Ticking the problem list

- Ticking or unticking an item on the main care plan saves it immediately, so closing the modal leaves nothing unsaved.

### Notes

- A note's card shows its author, who it was written on behalf of, and its date recorded on one line, with the note's text beneath.
- The form for adding a note has On behalf of, Date Recorded and the note's text. Date Recorded starts at the current date and time.
- Add note is unavailable until the note's text has something other than spaces.
- Adding a note places it last among the notes and clears the whole form, so each note starts with On behalf of empty.

### Card actions

- Each card has an actions menu. The main care plan's offers Edit and Change log; a note's offers Edit, Change log and Delete.
- Change log appears in the menu once the card has changed since it was first saved, as set out under [Change log](#change-log).
- Edit replaces the card with an edit form in place, holding On behalf of, Date Recorded and the text. The main care plan's edit form also holds its problem list, to the left of the text, written as in the [Add care plan form](#writing-the-problem-list).
- The text is required when editing, and saving without it shows "*Required" beneath the field.
- Editing the main care plan keeps the ticks on the items that remain.
- Save keeps the changes and Cancel discards them, each returning the card to its place.
- Delete removes the note immediately.

## Change log

- A card's change log records the changes made to it after it was first saved, and is opened from the card's Change log action.
- A saved edit is recorded only when it changed something, so saving an edit unchanged records nothing.
- The Change Log opens over the care plan modal, with a strip of details, then every entry from newest to oldest, then a Close beneath a divider.
- For the main care plan, the details are the care plan, who last updated it (or on whose behalf), and when it was last updated. For a note, they are the care plan, who wrote it (or on whose behalf), and its date recorded.
- Each entry starts with who made the change, who it was made on behalf of, and the date and time it was recorded.
- The first entry is the care plan or note as first saved.

### What an entry shows

| Change | Entry shows |
| --- | --- |
| Edit to the text or the problem list | The whole text as saved and, for the main care plan, the problem list beneath the subheading Problem list with each item's tick |
| Edit to On behalf of or Date Recorded alone | The change on its own, such as "On behalf of changed from Adeline Young to Mele Tupou", "Date recorded changed from 11/11/2026 05:12 PM to 10/11/2026 09:00 AM", "On behalf of set to Adeline Young" or "On behalf of removed (was Adeline Young)" |
| Edit to both | The changes to On behalf of or Date Recorded first, then the whole text and problem list |
| Ticks on the main care plan | One line per item whose tick changed, such as "Ticked: Refer to dietitian" or "Unticked: Foot examination at every visit" |
| A note deleted | On the main care plan's change log, "Deleted note:" followed by the deleted note's text |

### When ticks are recorded

- Ticks are recorded when the care plan modal closes, as one entry listing the items whose tick differs from when the modal was opened, so an item ticked and unticked again in the same opening has no line.
- Saving an edit to the main care plan while the modal is open records the ticks made before it, ahead of the edit's own entry.

> [!NOTE]
> Recording the net change on close keeps a corrected mis-tick out of the change log, while still showing who changed each item and when.
