# Enhanced Material Icons System for Tupaia

This enhancement expands Tupaia's icon support from a predefined set to **any Material-UI icon**, providing flexibility while maintaining backward compatibility.

## Overview

Previously, Tupaia was limited to a small predefined set of icons for map overlays and markers. This enhancement allows developers to use any of the 1000+ Material-UI icons available in the `@material-ui/icons` package.

## Key Features

### ✅ **Unlimited Icon Support**
- Use any Material-UI icon by name (e.g., `FlightTakeoff`, `Computer`, `Restaurant`, `LocalHospital`)
- Over 1000+ icons available compared to the previous ~15 predefined icons

### ✅ **Backward Compatibility**
- All existing predefined icons continue to work
- No breaking changes to existing code

### ✅ **Dynamic Loading**
- Icons are loaded on-demand for optimal performance
- Automatic caching to prevent redundant imports

### ✅ **Robust Fallback System**
- Graceful degradation when icons aren't found
- Category-based fallbacks (medical, location, transport, etc.)

### ✅ **Developer-Friendly Tools**
- Icon validation functions
- Search and suggestion capabilities
- Interactive icon picker component

## Quick Start

### Basic Usage

```jsx
import { getMarkerForOption, MarkerIcon } from './components/Map/markerIcons';

// Use any Material-UI icon
const hospitalIcon = getMarkerForOption({ iconKey: 'LocalHospital' });
const flightIcon = getMarkerForOption({ iconKey: 'FlightTakeoff' });
const restaurantIcon = getMarkerForOption({ iconKey: 'Restaurant' });

// Enhanced component with size and color options
<MarkerIcon 
  iconKey="LocalHospital" 
  size="large" 
  color="primary" 
  category="medical"
/>
```

### Migration Example

**Before (Limited):**
```jsx
// Only these predefined icons worked
getMarkerForOption({ iconKey: 'hospital' });    // ✓
getMarkerForOption({ iconKey: 'pharmacy' });    // ✓
getMarkerForOption({ iconKey: 'FlightTakeoff' }); // ✗ Failed
```

**After (Enhanced):**
```jsx
// Backward compatible + unlimited new icons
getMarkerForOption({ iconKey: 'hospital' });     // ✓ Still works
getMarkerForOption({ iconKey: 'pharmacy' });     // ✓ Still works
getMarkerForOption({ iconKey: 'FlightTakeoff' }); // ✓ Now works!
getMarkerForOption({ iconKey: 'Computer' });      // ✓ Now works!
getMarkerForOption({ iconKey: 'MusicNote' });     // ✓ Now works!
```

## API Reference

### `getMarkerForOption(options)`

Enhanced function to get marker icons with full Material-UI support.

**Parameters:**
- `iconKey` (string): Any Material-UI icon name or legacy predefined key
- `category` (string, optional): Category for fallback selection ('medical', 'location', 'transport', etc.)
- `iconProps` (object, optional): Props to pass to the icon component
- `fallbackIcon` (string, optional): Specific fallback icon name

**Example:**
```jsx
const icon = getMarkerForOption({
  iconKey: 'LocalHospital',
  category: 'medical',
  iconProps: { style: { fontSize: 32, color: 'red' } }
});
```

### `MarkerIcon` Component

Enhanced component with additional features for size, color, and styling.

**Props:**
- `iconKey` (string): The icon key/name
- `size` (string|number): 'small', 'medium', 'large', or pixel value
- `color` (string): Material-UI color ('primary', 'secondary', 'error', etc.)
- `category` (string): Category for fallback
- `onClick` (function): Click handler
- `className` (string): Additional CSS classes

**Example:**
```jsx
<MarkerIcon 
  iconKey="Flight" 
  size="large" 
  color="primary"
  onClick={() => alert('Flight clicked!')}
/>
```

### `validateIconKey(iconKey)`

Validates if an icon key can be resolved to a Material-UI icon.

**Parameters:**
- `iconKey` (string): The icon key to validate

**Returns:** `Promise<boolean>`

**Example:**
```jsx
const isValid = await validateIconKey('FlightTakeoff'); // true
const isInvalid = await validateIconKey('NonExistentIcon'); // false
```

### `getIconSuggestions(query, limit)`

Get suggestions for icon names based on partial input.

**Parameters:**
- `query` (string): Partial icon name
- `limit` (number, optional): Maximum suggestions (default: 10)

**Returns:** `string[]`

**Example:**
```jsx
const suggestions = getIconSuggestions('flight'); 
// Returns: ['Flight', 'FlightTakeoff', 'FlightLand']
```

### `IconPicker` Component

Interactive component for selecting icons with search functionality.

**Props:**
- `onIconSelect` (function): Callback when icon is selected
- `selectedIcon` (string): Currently selected icon
- `availableIcons` (array): Custom list of available icons
- `maxDisplay` (number): Maximum icons to display

**Example:**
```jsx
<IconPicker
  onIconSelect={(iconName) => setSelectedIcon(iconName)}
  selectedIcon={selectedIcon}
  maxDisplay={24}
/>
```

## Supported Icon Categories

The system includes smart fallbacks for different categories:

### Medical & Health
- `LocalHospital`, `Healing`, `LocalPharmacy`, `Favorite`, `AccessibleForward`

### Location & Navigation  
- `LocationOn`, `Map`, `Place`, `Room`, `MyLocation`, `NearMe`

### Transportation
- `DirectionsBus`, `Train`, `Flight`, `DriveEta`, `TwoWheeler`, `DirectionsWalk`

### Buildings & Places
- `Business`, `School`, `Restaurant`, `Hotel`, `ShoppingCart`, `Park`

### Services
- `LocalAtm`, `LocalGasStation`, `LocalCafe`, `LocalBar`, `Spa`

## Implementation Files

### 1. `materialIconLoader.js`
Core utility for dynamically loading Material-UI icons with caching and fallback support.

### 2. `markerIcons.jsx`
Enhanced marker icon system with backward compatibility and new features.

### 3. `IconUsageExample.jsx`
Comprehensive example demonstrating all features and migration patterns.

## Performance Considerations

### Dynamic Loading
- Icons are loaded only when needed using React's `lazy()` and `Suspense`
- Automatic caching prevents redundant imports
- Fallback system ensures UI never breaks

### Bundle Size
- No impact on initial bundle size
- Each icon is loaded separately when first used
- Shared icons across components are cached

## Migration Guide

### For Existing Code
**No changes required!** All existing icon usage continues to work:

```jsx
// These continue to work exactly as before
getMarkerForOption({ iconKey: 'hospital' });
getMarkerForOption({ iconKey: 'pharmacy' });
getMarkerForOption({ iconKey: 'location' });
```

### For New Features
Take advantage of the expanded icon library:

```jsx
// Now you can use any Material-UI icon
getMarkerForOption({ iconKey: 'FlightTakeoff' });
getMarkerForOption({ iconKey: 'Computer' });
getMarkerForOption({ iconKey: 'MusicNote' });
getMarkerForOption({ iconKey: 'SportsSoccer' });
```

### Best Practices

1. **Use Descriptive Names**: Prefer `LocalHospital` over generic `hospital`
2. **Validate in Development**: Use `validateIconKey()` to check icon names
3. **Provide Fallbacks**: Specify `category` for better fallback behavior
4. **Test Icon Loading**: Ensure icons load properly in your environment

## Examples

### Basic Overlay Icons
```jsx
// Medical facilities
<MarkerIcon iconKey="LocalHospital" size="large" color="error" />
<MarkerIcon iconKey="LocalPharmacy" size="medium" color="primary" />

// Transportation
<MarkerIcon iconKey="Flight" size="medium" color="action" />
<MarkerIcon iconKey="Train" size="medium" color="primary" />

// Entertainment
<MarkerIcon iconKey="Restaurant" size="small" color="secondary" />
<MarkerIcon iconKey="SportsSoccer" size="medium" color="primary" />
```

### Advanced Usage with Validation
```jsx
const IconWithValidation = ({ iconKey }) => {
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    validateIconKey(iconKey).then(setIsValid);
  }, [iconKey]);
  
  if (!isValid) {
    return <MarkerIcon iconKey="Help" size="medium" />;
  }
  
  return <MarkerIcon iconKey={iconKey} size="medium" />;
};
```

## Troubleshooting

### Icon Not Loading
1. Check if the icon name is correct (case-sensitive)
2. Verify the icon exists in Material-UI icons
3. Use `validateIconKey()` to test programmatically

### Performance Issues
1. Ensure React Suspense is properly configured
2. Check browser network tab for loading issues
3. Verify caching is working (icons should only load once)

### Fallback Not Working
1. Check if category fallbacks are properly defined
2. Ensure fallback icons themselves are valid
3. Verify the fallback system configuration

## Future Enhancements

- [ ] Support for custom SVG icons alongside Material Icons
- [ ] Icon theming and color customization
- [ ] Advanced search with tags and categories
- [ ] Integration with icon management APIs
- [ ] Accessibility improvements for screen readers

## Resources

- [Material-UI Icons Documentation](https://mui.com/material-ui/material-icons/)
- [React Lazy Loading Guide](https://react.dev/reference/react/lazy)
- [Material Design Icons](https://fonts.google.com/icons)