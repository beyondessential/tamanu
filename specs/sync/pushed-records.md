---
id: PUSH
---

# Records pushed to the central server

Applies to how the central server accepts patient communications and report requests that a facility server pushes to it.

## Patient communications

- A patient communication pushed from a facility never carries an attachment. Attachments are files the central server generates itself, such as a certificate, and are only ever attached by its own tasks.
- A communication on an email channel has either no destination, in which case the patient's own email address is used, or a single email address.
- A communication on an email channel whose destination is anything else, such as a list of addresses or an address with a display name, is stored with the Bad Format status and an error, and is never sent.
- The address a communication is sent to, whether its destination or the patient's own address, is checked again when it is sent. A communication whose address is not a single email address is given the Bad Format status and is not sent.
- The central server only sends, and afterwards deletes, an attachment that it generated itself in its own temporary directory. A communication whose attachment is anywhere else is stored with the Bad Format status and is not sent, and the file is left untouched.

## Report requests

- A report request pushed from a facility asks for the report to be emailed to a list of email addresses and to nothing else. The recipients the central server stores are exactly that list.
- Recipients given as a plain comma-separated string are read as the same list of email addresses.
- A report request whose recipients are empty, are not all email addresses, or ask for any other kind of destination is stored with the Error status and the error "Invalid recipients", and is never run.
- A report request is only run when the user it names as the requester holds permission to run that report, and for the generic survey export, to read the survey being exported.
- The requester must also be able to use at least one of the facilities that the sync pushing the request is for. A request pushed outside a sync session has no such facility.
- A report request whose requester lacks that permission, does not exist, or names a report that does not exist is stored with the Error status and an error, and is never run.
- Each request in a batch is checked on its own, so one rejected request does not affect the others.

> [!NOTE]
> Reports the central server schedules for itself are created on the central server rather than pushed, and may deliver to a local folder or to S3 as well as to email.
