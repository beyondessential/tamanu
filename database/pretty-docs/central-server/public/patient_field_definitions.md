## patient_field_definitions

Custom inputs to be included in the Tamanu patient details screens.

These are grouped using `categories`.

## name

Name of the input.

## field_type

Input field type.

One of:
- `string`
- `number`
- `select`

## options

When `type = 'select'`, the list of options for this select.

PostgreSQL array of strings.

## category_id

The `category` this field is in.

