# Y10 plan

## Notes

- All changes sit in the shared `packages/web/app/components/Table/Paginator.jsx`, so every paginated web table picks them up
- The count's meaning changes, so it gets new string IDs rather than reusing `general.table.pageRecordCount`. Translations have no plural support, so the single-number range ("Showing 11 of 11 records") and the one-record total ("Showing 1 of 1 record") each need their own string
- The rows-per-page `Select` already passes a `label` prop, but MUI's `Select` doesn't render it. The visible label needs to be its own element, tied to the dropdown with `aria-labelledby` (the mockup does this)
- Update `packages/web/__tests__/components/Table/Paginator.test.jsx` and any e2e page objects that read the count text (`packages/e2e-tests/pages/patients/PatientTable.ts` and friends)
