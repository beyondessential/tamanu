## invoices

Invoices related to encounters.

## display_id

Short unique identifier used on the frontend.

## status

Status of the invoice.

One of:
- `cancelled`
- `in_progress`
- `finalised`

## encounter_id

Reference to the `encounter` this invoice is a part of.

## patient_payment_status

Payment status (patient portion, if applicable).

One of:
- `unpaid`
- `paid`
- `partial`

## insurer_payment_status

Payment status (insurer portion, if applicable).

One of:
- `unpaid`
- `paid`
- `partial`
- `rejected`

