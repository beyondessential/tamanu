## report_definitions

A name for a report.

This is what you see when selecting a report to generate in Tamanu.

The actual data is in `versions`.

## name

Human-friendly name of the report.

## db_schema

The name of the database schema (namespace) which is queried.

Defaults to `reporting`, which are standardised and normalised views designed specifically for
reporting; sometimes this is set to `public` to query the raw database directly.

