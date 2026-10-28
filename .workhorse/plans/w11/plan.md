# View patient details from an invoice

## Dependencies

The patient details modal reuses the Details tab's form, and the invoicing spec points to X11's
patient details spec (`patient/details.md`) for its sections, fields and validation. X11 adds that
spec and the Billing information section, so it needs to merge before this card, or this card's
build has to carry both.

Both cards add sections to `specs/invoicing/overview.md`. They touch different parts of the file
and merge without conflict.
