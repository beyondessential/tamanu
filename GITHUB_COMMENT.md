## Analysis: Why `undefined` is Correct

@cursor Bugbot's suggestion to revert from `undefined` to `''` would **reintroduce the bug** this PR fixes. Here's why:

### The Bug
When switching from a medication with route/units data to one without, the dropdowns show a clear icon ("X") even though they're empty.

### Why `undefined` Fixes It ✅

The Dropdown component (`packages/mobile/App/ui/components/Dropdown/index.tsx`) uses a default parameter:
```typescript
export const Dropdown = React.memo(({
  value = [],  // Line 97
  // ...
}: DropdownProps) => {
```

**When `value={undefined}` is passed:**
1. Default parameter activates → `value` becomes `[]`
2. State initializes as `selectedItems = []`
3. No clear icon shows (correct behavior)

**When `value={''}` is passed:**
1. Default parameter doesn't activate (empty string is truthy)
2. State initializes as `selectedItems = ['']`
3. Clear icon shows for the "selected" empty string (the bug!)

### Why `allowResetSingleValue` Matters

Both dropdowns use this prop (lines 435 & 468):
```tsx
<Field component={Dropdown} name="route" allowResetSingleValue />
<Field component={Dropdown} name="units" allowResetSingleValue />
```

This mechanism is **designed** to work with `undefined` values to trigger the default parameter and properly reset the dropdown state.

### JavaScript Default Parameters

This is standard JavaScript behavior:
```javascript
function example(value = []) { return value; }
example(undefined);  // returns []
example('');         // returns ''
```

The Dropdown component intentionally leverages this language feature.

### Verdict

The current code using `undefined` is correct and addresses the user-reported bug. See the detailed documentation in the repo:
- `SUMMARY_FOR_REVIEWERS.md` - Quick overview
- `BUGBOT_ANALYSIS_RESPONSE.md` - Complete technical analysis
- `test-scenario-explanation.md` - Test scenarios
- Inline code comment at line 351-353

**Recommendation:** Dismiss Bugbot's suggestion and approve the current fix.
