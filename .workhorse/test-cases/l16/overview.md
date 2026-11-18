# Chart and vitals history order

Scenarios for the `order` query parameter on the vitals list and chart readings endpoints.

## Ordering

- [x] With no order given, the latest reading comes first
- [x] `ASC` and `DESC` are accepted in either case and sort readings by recorded date
- [x] A value other than ascending or descending is rejected as a validation error, on both the vitals and the chart readings endpoints
- [ ] The vitals and charts tabs on an encounter, and a program registry patient's chart, still list readings latest first
