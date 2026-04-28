# Test Scenario: Demonstrating the Bug and Fix

## Scenario: Switching Between Medications

### Setup
1. Medication A has `referenceDrug_route = "ORAL"` and `referenceDrug_units = "mg"`
2. Medication B has `referenceDrug_route = null` and `referenceDrug_units = null` (or undefined)

### User Action
1. User opens the prescribe medication form
2. User selects Medication A
   - Route dropdown shows "ORAL"
   - Units dropdown shows "mg"
3. User changes their mind and selects Medication B instead

### Expected Behavior (CORRECT)
- Route dropdown should be empty with placeholder "Select"
- Units dropdown should be empty with placeholder "Select"
- No clear icon ("X") should appear on empty dropdowns

### Actual Behavior with `''` (BUG - before this fix)
When the code uses `|| ''`:
```typescript
route: selectedItem?.referenceDrug_route?.toLowerCase() || '',  // ❌ BUG
units: selectedItem?.referenceDrug_units || '',                  // ❌ BUG
```

After selecting Medication B:
- Route dropdown shows **clear icon "X"** but no value
- Units dropdown shows **clear icon "X"** but no value
- User is confused: "Why is there an X when there's nothing selected?"
- This is the bug @tcodling reported

**Technical reason:**
- Formik `values.route = ''` and `values.units = ''`
- Dropdown receives `value={''}` 
- Dropdown's `useState` initializes `selectedItems = ['']`
- MultiSelect sees `selectedItems.length === 1` and shows clear icon

### Actual Behavior with `undefined` (FIXED - current PR)
When the code uses `|| undefined`:
```typescript
route: selectedItem?.referenceDrug_route?.toLowerCase() || undefined,  // ✅ FIX
units: selectedItem?.referenceDrug_units || undefined,                  // ✅ FIX
```

After selecting Medication B:
- Route dropdown shows placeholder "Select" with no clear icon
- Units dropdown shows placeholder "Select" with no clear icon
- User sees correct empty state
- This matches the expected behavior

**Technical reason:**
- Formik `values.route = undefined` and `values.units = undefined`
- Dropdown receives `value={undefined}`
- Dropdown's default parameter activates: `value = []`
- Dropdown's `useState` initializes `selectedItems = []`
- MultiSelect sees `selectedItems.length === 0` and doesn't show clear icon

## Why This Matters for `allowResetSingleValue`

Both dropdowns have `allowResetSingleValue={true}`, which means:
- They should reset to empty when the parent form changes their value
- This is crucial for the medication switch scenario

The `allowResetSingleValue` mechanism works via the useEffect:
```typescript
useEffect(() => {
  if (!allowResetSingleValue || Array.isArray(value)) return;
  if (value !== selectedItems[0]) {
    setSelectedItems([value]);
  }
}, [value, allowResetSingleValue]);
```

**With `undefined` (correct):**
- `value` becomes `[]` (due to default parameter)
- `Array.isArray(value)` is `true`
- Effect returns early, leaving `selectedItems = []`
- Dropdown shows empty state correctly

**With `''` (broken):**
- `value` is `''` (string)
- `Array.isArray(value)` is `false`
- Effect runs: `setSelectedItems([''])`
- Dropdown shows clear icon for empty string

## Conclusion

The `undefined` fallback is **essential** for the `allowResetSingleValue` mechanism to work correctly with the Dropdown component's default parameter design. Using `''` breaks this mechanism and causes the empty-dropdown-with-X bug.
