---
id: MANUAL
---

# End user manuals

Task-based guides that show a clinician or administrator how to carry out a piece of
work in Tamanu. They are written for the person using the product, and they live in the
Tamanu repository alongside the code they describe.

## Location and structure

- [ ] Manuals live under `docs/user-manuals/`.
- [ ] The first level below that is the platform: `desktop/` and `mobile/`.
- [ ] The second level is the module, one folder per module, named for the part of the
      product a user would recognise. The name the product's own navigation gives that
      area is the starting point, and an author departs from it where a clearer name
      serves the reader better.
- [ ] A module folder holds one file per guide.
- [ ] Each level carries an `index.md` listing what sits beneath it: the manuals root
      lists the platforms, a platform lists its modules, and a module lists its guides.
- [ ] An index entry names its target by the guide's or module's title and links to it.
- [ ] A module's index lists its guides in the order a reader would carry the tasks out,
      so that reading down the list follows the work rather than the alphabet.

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
- [ ] Where a reader needs something in hand before starting, or needs to know something
      that would otherwise interrupt the steps, the guide says so under its own heading
      before the steps begin. A guide with nothing to state there goes straight to the
      steps.
- [ ] A guide covering a task whose errors readers commonly meet closes by naming those
      errors and what to do about each. A task whose errors are rare or obscure ends at
      its outcome.
- [ ] Each error is headed by the message the product shows, word for word, so a reader
      matches what is on their screen against the list at a glance. What caused it and
      how to get past it follow underneath.

## Scope

Guides describe how the product works, which is the same wherever Tamanu runs. How a
particular site has been set up is configuration, and belongs to the configuration
guides.

- [ ] A guide describes the product's mechanics rather than a site's configuration, so
      that it holds true at every deployment.
- [ ] Where a form's content is configured per site, the guide covers finding the form,
      selecting it, completing it, and submitting it, and leaves the form's own fields
      alone.
- [ ] A guide covering an action that a site can switch on or off notes that the action
      depends on how the reader's site is set up, so a reader who cannot find it knows
      why.
- [ ] Where an action may be unavailable to a reader, whether because their site has not
      enabled it or because their account lacks the permission, the guide tells them to
      contact their system administrator if they believe they should be able to carry it
      out.

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
- [ ] Every placeholder takes the same form, a bolded `[Screenshot: ...]` whose text
      describes the shot, so that outstanding screenshots across the whole manual are
      found by searching for one string.
- [ ] Screenshots sit where a visual helps the reader, typically on reaching a new screen
      or at a step that words describe poorly, rather than at a fixed rate per step.

## Accuracy

- [ ] A guide describes the product as it currently ships, naming the buttons, tabs, and
      screens the reader actually encounters.
- [ ] A guide is verified against the running product before it is published.
