# User guide format

How an end user guide in `docs/user-manuals/` is laid out and written. The `draft-user-guide` skill
follows it; follow it too when writing or editing a guide by hand.

User guides are task guides for the clinical and administrative staff who use Tamanu, often read
quickly and often on a ward. Assume no knowledge of Tamanu's internals.

- **Describe the product, not a site's configuration.** A guide should hold at every deployment. Where
  a form's content is configured per site, such as the vitals survey, cover finding, completing and
  submitting the form, and leave its fields alone
- **Say when an action depends on setup.** Where a site can switch an action off, or an account may
  lack the permission, say so, and tell the reader to contact their system administrator if they
  believe they should be able to carry it out
- **Name on-screen words exactly**, in bold, without quotation marks: buttons, fields, tabs and screens
- **Write plainly.** Short sentences in the active voice, addressing the reader as "you", one
  instruction to a sentence, and no technical or developer terms
- **Assume nothing the reader hasn't been told**, starting from the place in the product the guide
  opens with
- **Case and spelling.** Module titles in title case, everything else in sentence case, and
  Australian/NZ English

## Location and numbering

Guides live under `docs/user-manuals/`, split by platform into `desktop/` and `mobile/`, then one
folder per module. A module is a functional area as a user thinks of it, named as the product's own
navigation names it unless a clearer name serves the reader better; an area reached through a tab is a
module in its own right. Desktop and mobile guides each stand alone and describe only that platform.

Modules are numbered in the order a user meets them, and each platform numbers from one. A module's
guides are numbered within it, in the order the tasks are carried out: Vitals is desktop module 10, and
its first guide is 10.1. **The number leads each folder and file name**, so the file tree shows the
order: the module folder is the number, zero-padded to two digits, then the module name in lowercase
kebab-case (`10-vitals/`), and the guide file is the guide's number within the module, then its name
(`1-record-vitals.md`). The number also appears in the module README heading (`# 10. Vitals`) and in
the README tables, and must match the name on disk.

Adding a module means creating its folder and README at the right point in the order, then renumbering
the modules below it: rename each folder, update its README heading and its platform README row, and
update every link into it, then check that every link still resolves.

Each level has a `README.md`. A platform README tables its modules (`# | Module | Guides`), and a
module README tables its guides (`# | Guide | Covers`). A module with no guide yet stays listed, and its
README says so. Publishing or updating a guide updates both.

## Structure

A guide covers a single user action, such as recording a set of vitals. Where a module's actions are
small and tightly related, group them into one guide rather than fragmenting into near-empty files.

Each guide opens with a **lead paragraph and no H1** (the title displays separately), saying what the
action achieves and where in the product the reader starts. Then, only if there is something to say, a
`# Before you start` section for what the reader needs first. Then `# Steps`:

- A numbered list, one number per action the reader takes
- Where an action needs several fields filled, they sit under its step rather than becoming steps
- Each step says what the reader does and, where it isn't obvious, what they see happen
- The guide ends with its last step: anything the reader needs to know a step worked goes in that step

## Formatting

Guides are markdown. Stick to the standard set of structure and formatting options, apart from the
image blocks below. Markdown carries no styling, so **never rely on styling to carry meaning**: an
image's border and outlines are drawn into the image itself.

## Screenshots

Screenshots follow one convention across Tamanu's user guides and configuration guides, so outstanding
shots everywhere are found by one search.

- **A shot not yet captured is a placeholder**: a bold `[Screenshot: ...]` on its own line, describing
  what the shot must show, e.g. `**[Screenshot: the Record vitals window]**`
- **Place a screenshot where a visual helps**, typically on reaching a new screen or where words
  describe a step poorly, rather than at a fixed rate
- **Capturing replaces the placeholder with the image**, so a guide holds one or the other, never both
- **Images live in an `images/` folder** beside the guides, named for the guide they belong to and what
  they show, in kebab-case: `record-vitals-empty-form.png`
- **Crop to the part of the screen the step is about**, so the words it names are readable. A shot of a
  dialog or form window is that window alone
- **Capture at twice screen resolution**, so text stays sharp when shown smaller
- **Every image has a thin black border**, drawn into the image itself
- **Outline in red the control the step asks the reader to select**, drawn into the image. Which
  controls are outlined is the author's call, so ask
- **Show each image centred and smaller than the text column**, at a `width` of about 0.31 times its
  pixel width
- **Every image has alt text** describing what the shot shows, including any red outline
- **Every image has a caption** in small text beneath it: one short sentence describing what the image
  shows or the action it illustrates, with Tamanu front-end text word for word in bold

```html
<p align="center">
  <img src="images/record-vitals-vitals-tab.png" alt="The encounter's Vitals tab, with the Record vitals button outlined in red" width="479"><br>
  <sub>Select <b>Record vitals</b> on the encounter's <b>Vitals</b> tab.</sub>
</p>
```

Screenshots are published, so they are taken against demonstration or test data and never show a real
patient.

## Cross-references

Link to another guide or module with a relative path, including its number: `../04-patients/` or
`1-record-vitals.md`.

## Accuracy rules

- **Describe the product as it currently ships**, naming the buttons, tabs and screens the reader
  actually meets
- **Verify every guide against a running demo site** before it is published
