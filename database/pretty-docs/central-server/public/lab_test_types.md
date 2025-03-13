## lab_test_types

A kind of test that's possible to request.

This includes information about the test itself, and also parameters around result formatting, like
data type, expected ranges, etc.

## code

Internal Tamanu code of the test.

## name

Human-friendly name of the test.

## unit

Unit the test result is measured in.

## male_min

Minimum typical range for males.

## male_max

Maximum typical range for males.

## female_min

Minimum typical range for females.

## female_max

Maximum typical range for females.

## range_text

Unused.

## result_type

Input type of result.

One of:
- `FreeText`
- `Number`
- `Select`

## options

Comma-separated list of options. Unused.

## lab_test_category_id

Reference to the category (`Reference Data`) of this test.

## external_code

External code for the test (such as for LIMS).

## is_sensitive

Used to indicate if the lab test type is sensitive and should be hidden accordingly.

