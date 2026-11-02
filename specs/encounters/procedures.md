---
id: PROC
---

# Procedures

Clinicians record the procedures performed during an encounter from the encounter's Procedures tab. Forms can be attached to a procedure to capture additional data against it. When a procedure's type has an invoice product configured, the procedure is automatically added to the encounter's invoice.

## Deleting a procedure

A clinician with permission to delete procedures can remove a procedure recorded in error, along with everything that was captured against it.

### Actions menu

- [ ] Each row of the procedures table ends with an actions menu at its far right, matching the actions menu on the Forms table.
- [ ] The actions menu offers a single option: Delete.
- [ ] The actions menu is hidden from users without permission to delete procedures.
- [ ] Opening the actions menu does not open the procedure.
- [ ] The actions menu is available whatever the procedure's status, including completed procedures, and on discharged encounters.

### Confirmation

- [ ] Choosing Delete opens a confirmation modal before anything is deleted.
- [ ] The confirmation modal warns that any forms attached to the procedure are deleted with it, and that the action is irreversible.
- [ ] Cancelling the confirmation leaves the procedure, its forms and the invoice unchanged.
- [ ] Confirming deletes the procedure and removes it from the procedures table.
- [ ] While the deletion is in progress, the confirm button shows it is working and cannot be pressed again.
- [ ] If the deletion fails, the user sees an error message, and the procedure stays in the procedures table.

### What is deleted

- [ ] Deleting a procedure requires permission to delete procedures; the server rejects the request from any user without it.
- [ ] Deleting a procedure deletes every form attached to it, including the form answers. Permission to delete procedures is sufficient for this.
- [ ] Each attached form is deleted with the same effect as deleting it from the Forms table, including any records that depend on the form.
- [ ] A deleted procedure's forms appear in neither the patient's nor the encounter's Forms table.
- [ ] When the procedure was automatically added to the encounter's invoice and that invoice is in progress, deleting the procedure removes that invoice item. Invoice items added manually stay on the invoice.
- [ ] A finalised or cancelled invoice is left unchanged when a procedure is deleted.
- [ ] Deletion is all-or-nothing: if any part fails, the procedure, its forms and the invoice item all remain.
- [ ] Deleted procedures and forms are soft-deleted: hidden throughout the product and retained in the database for audit.
