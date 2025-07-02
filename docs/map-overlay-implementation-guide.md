# Map Overlay Implementation Guide for Tuplia

## Analysis Summary

**Finding**: No existing "icon type map overlay" functionality was found in the Tuplia codebase after comprehensive investigation.

## Current Icon Infrastructure

### Strong Foundation Available
- **Mobile**: 68+ custom SVG icons in `packages/mobile/App/ui/components/Icons/`
- **Web**: Material UI icons + custom SVGs in `packages/web/app/assets/icons/`  
- **Patterns**: Well-established icon configuration patterns (HeaderIcons, ENCOUNTER_OPTIONS, etc.)

## Recommended Implementation Approach

### 1. Icon Library Integration

Install React Icons for access to 47,000+ icons:
```bash
npm install react-icons
```

Key libraries to support:
- **Material Design Icons** (4000+ icons) - `react-icons/md`
- **FontAwesome** - `react-icons/fa`
- **Heroicons** - `react-icons/hi`
- **Feather** - `react-icons/fi`

### 2. Database Schema

```sql
-- Map overlay configuration
CREATE TABLE map_overlays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  icon_library VARCHAR(50) DEFAULT 'material',
  allowed_icons TEXT[], -- JSON array of icon keys
  default_icon VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual map points
CREATE TABLE map_overlay_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overlay_id UUID REFERENCES map_overlays(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  icon_type VARCHAR(100) NOT NULL,
  icon_color VARCHAR(20),
  title VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Core Components

```typescript
// packages/web/app/components/MapOverlay/IconSelector.tsx
import { 
  MdPets, // Dogs
  MdCat, // Cats
  MdLocalHospital, // Hospital
  MdHome, // Housing
  MdSchool // Education
} from 'react-icons/md';

export const ICON_LIBRARIES = {
  material: {
    pets: MdPets,
    cat: MdCat,
    hospital: MdLocalHospital,
    home: MdHome,
    school: MdSchool,
    // Expandable to thousands...
  }
};
```

### 4. Configuration Examples

**Health Facilities**:
```typescript
const healthOverlay = {
  type: 'health_facility',
  iconLibrary: 'material',
  allowedIcons: ['local_hospital', 'local_pharmacy', 'healing', 'vaccines']
};
```

**Community Resources** (including animals):
```typescript  
const communityOverlay = {
  type: 'community_resource',
  iconLibrary: 'material', 
  allowedIcons: ['pets', 'cat', 'home', 'school', 'water_drop', 'eco']
};
```

## Implementation Priority

1. **Phase 1**: Create basic map overlay infrastructure
2. **Phase 2**: Integrate React Icons with icon browser
3. **Phase 3**: Build admin interface for overlay configuration
4. **Phase 4**: Add mobile support if needed

## Benefits

- **47,000+ icons** from standard libraries
- **Admin-configurable** icon sets per overlay type
- **Performance optimized** with tree-shaking
- **Future-proof** with established icon libraries
- **Consistent** with Tuplia's architectural patterns

This approach transforms the limitation of a specific icon set into unlimited icon possibilities while maintaining system consistency.