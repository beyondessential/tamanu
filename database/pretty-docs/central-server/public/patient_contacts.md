## patient_contacts

Describes how a patient may be contacted, via email, SMS, or IM apps.

At present, this is used for:
- display in the application (all methods)
- emailing the patient (`method=Email`)
- sending Telegram reminders for appointments (`method=Telegram`)

## name

Free-form name of the contact method.

This could be the name of the patient, or a relationship if the contact method is via another person
(e.g. `Spouse`, `Parent`, `Caregiver`), or a logical keyword if multiple contacts of the same method
are provided (e.g. `Main`, `Primary`, `Work`, `Home`), etc.

## method

What application the contact uses:
- `Email`
- `Sms`
- `WhatsApp`
- `Telegram`

## connection_details

JSON structure containing the details of the contact.

Its schema varies based on the `method`.

## patient_id

Reference to the `patient`.

## relationship_id

If the contact method is via another person.

