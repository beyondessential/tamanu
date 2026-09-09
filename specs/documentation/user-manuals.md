---
id: MANUAL
---

# End user manuals

Task-based guides that show a clinician or administrator how to carry out a piece of
work in Tamanu. They are written for the person using the product, not for the person
configuring or building it, and they live in the Tamanu repository alongside the code
they describe.

Configuration and setup material for project managers is a separate concern and stays
out of the manuals.

## Location and structure

- [ ] Manuals live under `docs/user-manuals/`.
- [ ] The first level below that is the platform: `desktop/` and `mobile/`.
- [ ] The second level is the module, one folder per module, named for the part of the
      product a user would recognise.
- [ ] A module folder holds one file per guide.
- [ ] Each level carries an index page listing what sits beneath it: the manuals root
      lists the platforms, a platform lists its modules, and a module lists its guides.
- [ ] An index entry names its target by the guide's or module's title and links to it.

## Platforms

- [ ] A guide covers one platform. Desktop and mobile guides for the same module each
      stand on their own and are read without reference to the other.
- [ ] A guide describes only what the reader can do on the platform it covers.

## What a guide covers

- [ ] A guide covers a single user action, such as recording a set of vitals or
      cancelling an appointment.
- [ ] A module whose actions are small or tightly related groups several into one guide,
      so that the guide stays the natural unit a reader would look for rather than
      fragmenting into near-empty files.
- [ ] A guide's title names the action from the reader's point of view.
- [ ] A guide opens by saying what the action achieves and where in the product the
      reader starts from.

## Instructional steps

- [ ] Steps are a numbered list, one number per action the reader takes.
- [ ] A step describes a single action. Where an action needs several fields filled, the
      fields sit under that step rather than becoming steps of their own.
- [ ] A step says what the reader does and, where the result is not obvious, what they
      see happen.
- [ ] A guide ends by stating the outcome, so the reader can confirm the task worked.

## Language

Guides are read by clinical and administrative staff, often quickly and often on a ward.
The writing carries no assumed knowledge of Tamanu's internals.

- [ ] Sentences are short and in the active voice, addressing the reader as "you", with
      one instruction to a sentence.
- [ ] Technical and developer terms are absent. Where a Tamanu term is unavoidable, the
      guide uses the exact word the product shows on screen.
- [ ] Buttons, fields, tabs, and screens are named exactly as they appear in the
      product, in bold, without quotation marks.
- [ ] A guide assumes no step the reader has not been told to take, starting from the
      place in the product its opening names.
- [ ] Spelling follows Australian/NZ English.

## Screenshots

- [ ] A screenshot that has not been captured appears as a visible placeholder line
      describing the shot the guide needs, so that an unfilled slot is apparent to a
      reader and to whoever fills it.
- [ ] Screenshots sit where a visual helps the reader, typically on reaching a new screen
      or at a step that words describe poorly, rather than at a fixed rate per step.

## Accuracy

- [ ] A guide describes the product as it currently ships, naming the labels, fields, and
      screens the reader actually encounters.
- [ ] A guide is verified against the running product before it is published.
