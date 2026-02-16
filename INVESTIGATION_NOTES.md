# COOL-35: SurveySelector Search Logic Investigation

## Problem
PR #8783 made all SelectInput fields searchable by setting `isSearchable={true}`. This broke SurveySelector and potentially other select fields that use JSX elements (like `<TranslatedReferenceData>`) as option labels, because react-select cannot extract searchable text from JSX elements.

## Solution Implemented

### Backend Changes
**File: `packages/shared/src/services/suggestions/suggestions.js`**
- Extended the survey suggester to support `surveyType` filtering parameter
- Now supports both `programId` and `surveyType` query parameters
- This enables proper server-side translation handling

### Frontend Changes

**File: `packages/web/app/views/programs/SurveySelector.jsx`**
- Replaced `SelectInput` with `DynamicSelectField`
- Now accepts a `suggester` prop instead of `surveys` array
- Removed dependency on manually fetched and mapped survey data
- Added support for optional `label` prop

**File: `packages/web/app/views/programs/ProgramsView.jsx`**
- Added `useSuggester` hook to create a survey suggester with `programId` filter
- Removed manual API call to fetch surveys (`/program/${programId}/surveys`)
- Removed manual mapping of surveys with TranslatedReferenceData labels
- Simplified `selectProgram` callback (no longer needs to fetch surveys)
- Updated SurveySelector usage to pass suggester instead of surveys array

**File: `packages/web/app/views/referrals/ReferralsView.jsx`**
- Added `useSuggester` hook to create a survey suggester with `surveyType: REFERRAL` filter
- Removed manual API call to fetch referral surveys
- Removed manual mapping of survey options
- Updated SurveySelector usage to pass suggester instead of surveys array

## Benefits
1. **Proper Translation Support**: Server-side translation handling via suggester API
2. **Searchable Surveys**: Users can now search surveys by translated names
3. **Consistent Pattern**: Using the same suggester pattern as other fields
4. **Reduced Code**: Eliminated manual API calls and data mapping
5. **Better UX**: Automatic switching between dropdown and autocomplete based on list size

## Other Select Fields with Potential Issues

### 1. Program Selector in ProgramsView.jsx (Line 154-169)
**Status**: ⚠️ Potential Issue
**Description**: Uses `SelectInput` with `TranslatedReferenceData` labels
```javascript
options={programs.map(p => ({
  value: p.id,
  label: <TranslatedReferenceData category="program" value={p.id} fallback={p.name} />,
}))}
```
**Severity**: Low - Programs are typically a small list (< 10 items), so search functionality may not be critical
**Recommendation**: Monitor for user complaints. If needed, create a program suggester endpoint.

### 2. Other Fields Investigated
- **PatientProgramRegistrationSelectSurvey.jsx**: ✅ OK - Uses plain string labels (`x.name`)
- **UserProfileModal.jsx**: ✅ OK - Only 2 status options (Active/Deactivated)
- **ReportGeneratorForm.jsx**: ✅ OK - Uses plain string labels
- Various other SelectFields with TranslatedText in labels were found but are for menu options (buttons), not searchable dropdowns

## Testing Recommendations
1. Test survey selection in Programs tab with translated UI language
2. Test referral survey selection with translated UI language
3. Verify search functionality works with translated survey names
4. Test with both small (< 7) and large (> 7) survey lists
5. Verify program selector still works (though search may not work with translations)

## Migration Notes
- The SurveySelector component API has changed:
  - Old: `<SurveySelector surveys={array} ... />`
  - New: `<SurveySelector suggester={suggesterInstance} ... />`
- Any other components using SurveySelector will need to be updated
- The backend suggester now supports filtering by `surveyType` in addition to `programId`
