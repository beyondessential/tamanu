# MAR give-dose popper with no dosing unit

Regression coverage for the crash where clicking **Given** on a medication whose drug has no dosing unit configured threw `Cannot read properties of undefined (reading 'length')` from the `StyledNumberFieldWrapper` padding interpolation, replacing the give-dose form with the error boundary.

The crash only fires during an actual render, so every case asserts on a render of the give-dose screen (`GivenScreen`), not on props or helpers.

## Automated (web unit test)

- [x] Give-dose screen renders without throwing when the prescription has no `dosingUnit` (`undefined` — the API strips null columns)
- [x] Give-dose screen renders without throwing when `dosingUnit` is `null` (paths that keep the null)
- [x] No unit suffix, and no "Unknown" placeholder, is shown when there is no dosing unit
- [x] The correct unit suffix still renders when the drug has a dosing unit (guard has not disabled the suffix for everyone)
