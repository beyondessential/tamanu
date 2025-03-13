## patient_communications

Messages being sent to a patient, via a variety of channels.

This is a multiplexed queue to send emails, SMS, IM messages, etc specifically to patients.

Processed by the `PatientEmailCommunicationProcessor` scheduled task.

## type

The type of communication.

This affects the template or action being taken.

## channel

The channel to send the message with.

One of:
- Email
- Sms
- WhatsApp
- Telegram

## subject

Subject line (short summary of the message).

This is the subject line of an email, or equivalent for other channels.

## content

Content of the message.

## status

Processing status of the communication.

One of:
- `Queued`
- `Processed`
- `Sent`
- `Error`
- `Delivered`
- `Bad Format`

## error

If the communication sending fails, this is the error.

## retry_count

How many times the sending has been retried.

## patient_id

The `patient` that communication is for.

## destination

Destination address to send this message to.

If this is not provided here, it will be derived from the patient, such as using the
``patient_contacts`` table.

## attachment

The attachment as a string.

## hash

Hash of original data that went into creating the row, for purposes of deduplication.

The hashing is done with the `hashtext` postgres function.

