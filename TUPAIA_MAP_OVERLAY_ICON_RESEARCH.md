# Tupaia Map Overlay Icon System Research

## Search Summary

I conducted an extensive search through the Tupaia codebase to locate the map overlay icon system mentioned, specifically looking for:
- `markerIcons.tsx` file
- `getMarkerForOption` function  
- Map overlay icon implementations
- `iconKey` parameter usage

**Result**: The specific files and functions mentioned were not found in the current codebase.

## Icon Systems Found in Tupaia

### 1. Material-UI Icons (Web Package)

The web package extensively uses Material-UI icons:

```javascript
// Examples from codebase
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
```

**Package**: `@material-ui/icons` version `^4.11.3`

### 2. Custom SVG Icons (Mobile Package)

The mobile package uses custom SVG icons via react-native-svg:

```typescript
// Example: packages/mobile/App/ui/components/Icons/Geolocate.tsx
export const Geolocate = memo((props: IconWithSizeProps) => {
  const xml = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.4499 9.16683C17.0666 5.69183..." fill="${theme.colors.PRIMARY_MAIN}"/>
  </svg>`;
  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
```

### 3. Icon Mapping Patterns

Found several icon mapping patterns:

```typescript
// packages/mobile/App/ui/helpers/constants.ts
export const HeaderIcons = {
  [EncounterType.Clinic]: Icons.ClipboardIcon,
  [EncounterType.Emergency]: Icons.FirstAidKitIcon,
  [EncounterType.Admission]: Icons.StethoscopeIcon,
  // ...
};
```

```javascript
// packages/web/app/constants/encounters.js
export const ENCOUNTER_OPTIONS = [
  {
    value: ENCOUNTER_TYPES.ADMISSION,
    image: medicationIcon,
  },
  {
    value: ENCOUNTER_TYPES.TRIAGE,
    image: patientIcon,
  },
  // ...
];
```

## Recommended Implementation Approach

Since the specific map overlay system wasn't found, here's how to implement arbitrary Material Icons support:

### Option 1: Create New Map Overlay Icon System

```typescript
// markerIcons.tsx - New file to create
import React from 'react';
import * as MaterialIcons from '@material-ui/icons';

// Type for icon mapping
interface IconMapping {
  [key: string]: React.ComponentType<any>;
}

// Predefined icons (your existing set)
const PREDEFINED_ICONS: IconMapping = {
  hospital: MaterialIcons.LocalHospital,
  school: MaterialIcons.School,
  restaurant: MaterialIcons.Restaurant,
  // ... existing predefined icons
};

// Function to get marker icon
export const getMarkerForOption = (iconKey: string): React.ComponentType<any> | null => {
  // First, check predefined icons
  if (PREDEFINED_ICONS[iconKey]) {
    return PREDEFINED_ICONS[iconKey];
  }
  
  // Then, try to get from Material Icons
  // Convert iconKey to PascalCase if needed
  const materialIconKey = iconKey.charAt(0).toUpperCase() + iconKey.slice(1);
  
  if (MaterialIcons[materialIconKey as keyof typeof MaterialIcons]) {
    return MaterialIcons[materialIconKey as keyof typeof MaterialIcons];
  }
  
  // Handle animal icons and other special cases
  const iconMap: IconMapping = {
    dog: MaterialIcons.Pets,
    cat: MaterialIcons.Pets,
    bird: MaterialIcons.Pets,
    // Add more mappings as needed
  };
  
  if (iconMap[iconKey]) {
    return iconMap[iconKey];
  }
  
  // Fallback to default icon
  return MaterialIcons.Place;
};

// Helper function to check if icon exists
export const isValidIconKey = (iconKey: string): boolean => {
  return getMarkerForOption(iconKey) !== MaterialIcons.Place;
};

// Get all available Material Icons
export const getAllAvailableIcons = (): string[] => {
  return [
    ...Object.keys(PREDEFINED_ICONS),
    ...Object.keys(MaterialIcons)
  ];
};
```

### Option 2: Enhanced Icon Resolution

```typescript
// Enhanced version with dynamic imports and validation
import React from 'react';

interface IconResolverOptions {
  fallbackIcon?: string;
  validateIcon?: boolean;
}

export class IconResolver {
  private static materialIconsCache = new Map<string, React.ComponentType<any>>();
  
  static async getMarkerForOption(
    iconKey: string, 
    options: IconResolverOptions = {}
  ): Promise<React.ComponentType<any>> {
    const { fallbackIcon = 'Place', validateIcon = true } = options;
    
    // Check cache first
    if (this.materialIconsCache.has(iconKey)) {
      return this.materialIconsCache.get(iconKey)!;
    }
    
    try {
      // Try to dynamically import the icon
      const iconModule = await import(`@material-ui/icons/${iconKey}`);
      const IconComponent = iconModule.default;
      
      if (validateIcon && IconComponent) {
        this.materialIconsCache.set(iconKey, IconComponent);
        return IconComponent;
      }
    } catch (error) {
      console.warn(`Icon "${iconKey}" not found in Material Icons`);
    }
    
    // Fallback to default icon
    const fallbackModule = await import(`@material-ui/icons/${fallbackIcon}`);
    return fallbackModule.default;
  }
  
  // Synchronous version using static imports
  static getMarkerSync(iconKey: string): React.ComponentType<any> {
    // Import all Material Icons statically
    const MaterialIcons = require('@material-ui/icons');
    
    // Handle common animal icons
    const animalIconMap = {
      dog: 'Pets',
      cat: 'Pets', 
      bird: 'Pets',
      fish: 'Pets',
    };
    
    const resolvedKey = animalIconMap[iconKey] || iconKey;
    
    // Try PascalCase conversion
    const pascalKey = resolvedKey.charAt(0).toUpperCase() + resolvedKey.slice(1);
    
    return MaterialIcons[pascalKey] || MaterialIcons.Place;
  }
}
```

### Option 3: Configuration-Based Approach

```typescript
// config/iconMappings.ts
export const ICON_MAPPINGS = {
  // Animal icons
  animals: {
    dog: 'Pets',
    cat: 'Pets',
    bird: 'Pets',
    fish: 'Pets',
  },
  
  // Location icons  
  locations: {
    hospital: 'LocalHospital',
    school: 'School',
    restaurant: 'Restaurant',
    home: 'Home',
  },
  
  // Activity icons
  activities: {
    sports: 'SportsBaseball',
    music: 'MusicNote',
    art: 'Palette',
  }
};

// utils/iconResolver.ts
import * as MaterialIcons from '@material-ui/icons';
import { ICON_MAPPINGS } from '../config/iconMappings';

export const getMarkerForOption = (iconKey: string): React.ComponentType<any> => {
  // Search in category mappings
  for (const category of Object.values(ICON_MAPPINGS)) {
    if (category[iconKey]) {
      const materialIconKey = category[iconKey];
      if (MaterialIcons[materialIconKey]) {
        return MaterialIcons[materialIconKey];
      }
    }
  }
  
  // Try direct Material Icons lookup
  const pascalKey = iconKey.charAt(0).toUpperCase() + iconKey.slice(1);
  if (MaterialIcons[pascalKey]) {
    return MaterialIcons[pascalKey];
  }
  
  // Fallback
  return MaterialIcons.Place;
};
```

## Usage Examples

```typescript
// Usage in map overlay component
const MapOverlay = ({ iconKey, ...props }) => {
  const IconComponent = getMarkerForOption(iconKey);
  
  return (
    <div className="map-marker">
      <IconComponent color="primary" fontSize="large" />
    </div>
  );
};

// Usage with validation
const validateIconKey = (iconKey: string): boolean => {
  const IconComponent = getMarkerForOption(iconKey);
  return IconComponent !== MaterialIcons.Place; // Not fallback
};
```

## Next Steps

1. **Locate or Create**: Find the existing map overlay system or create the new `markerIcons.tsx` file
2. **Implement**: Choose one of the approaches above based on your needs
3. **Test**: Verify that animal icons (dog, cat, etc.) resolve correctly
4. **Extend**: Add more icon mappings as needed
5. **Document**: Update documentation for developers on available icons

## Available Material Icons for Animals

Some relevant Material Icons that could work for animals:
- `Pets` - General pet icon
- `ModeOfTravel` - Could work for various animals
- `Nature` - Nature-related icon
- `Park` - Outdoor/nature icon

You may need to use the generic `Pets` icon for most animals or consider adding custom SVG icons for specific animals if Material Icons doesn't have them.