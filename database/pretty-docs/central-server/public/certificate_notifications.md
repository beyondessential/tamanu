## certificate_notifications

Various medical certificates being sent to patients.

These rows are processed by the `CertificateNotificationProcessor` scheduled task, and generate a
``patient_communications`` row.

The actual certificate itself is stored separately on the filesystem while it's generated.

## type

Type of certificate being generated.

This dictates both from which resource the certificate is generated, and also the template being
used for generating the certificate itself.

One of:
- `covid_19_clearance`
- `vaccination_certificate`
- `icao.test`
- `icao.vacc`

## require_signing

If the certificates requires cryptographic signing.

See ``certifiable_vaccines``.

Only applicable to `icao.test` and `icao.vacc` types.

## patient_id

Reference to a `patient`.

## forward_address

An email address to send the generated certificate to.

## lab_test_id

The `lab test` this certificate is for, if applicable.

## status

Processing status.

One of:
- `Queued`
- `Processed`
- `Error`
- `Ignore`

## error

If the certificate generation fails, this is the error.

## created_by

The name of the user who initiated the creation of this certificate.

## lab_request_id

The `lab request` this certificate is for, if applicable.

## printed_date

When this certificate was printed, if applicable.

## facility_name

The name of the facility where the creation of this certificate was initiated.

## language

Used to translate the certificate.

