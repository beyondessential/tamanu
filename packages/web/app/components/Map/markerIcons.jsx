import React from 'react';
import { DynamicMaterialIcon, COMMON_MATERIAL_ICONS, normalizeIconName } from '../../utils/materialIconLoader';

// Legacy predefined icon set (maintained for backward compatibility)
export const PREDEFINED_MARKER_ICONS = {
  hospital: 'LocalHospital',
  clinic: 'LocalHospital',
  pharmacy: 'LocalPharmacy',
  location: 'LocationOn',
  home: 'Home',
  school: 'School',
  restaurant: 'Restaurant',
  shopping: 'ShoppingCart',
  transport: 'DirectionsBus',
  park: 'Park',
  water: 'Water',
  government: 'AccountBalance',
  emergency: 'Warning',
  security: 'Security',
  community: 'People',
};

// Default fallback icons for different categories
const CATEGORY_FALLBACKS = {
  medical: 'LocalHospital',
  location: 'LocationOn',
  building: 'Business',
  transport: 'DirectionsBus',
  default: 'Place',
};

/**
 * Enhanced function to get marker icon that supports any Material Icons
 * @param {Object} options - Configuration options
 * @param {string} options.iconKey - The icon key/name (can be any Material Icon name)
 * @param {string} options.category - Optional category for fallback selection
 * @param {Object} options.iconProps - Props to pass to the icon component
 * @param {string} options.fallbackIcon - Specific fallback icon name
 * @returns {React.Component} The icon component to render
 */
export const getMarkerForOption = ({
  iconKey,
  category = 'default',
  iconProps = {},
  fallbackIcon = null,
  ...restProps
}) => {
  if (!iconKey) {
    console.warn('No iconKey provided to getMarkerForOption');
    return (
      <DynamicMaterialIcon
        iconName={CATEGORY_FALLBACKS.default}
        iconProps={iconProps}
        {...restProps}
      />
    );
  }

  // Try to normalize the icon name to proper Material-UI format
  const normalizedIconName = normalizeIconName(iconKey);
  
  // First, try to use the iconKey directly (for Material Icons)
  if (normalizedIconName) {
    return (
      <DynamicMaterialIcon
        iconName={normalizedIconName}
        iconProps={iconProps}
        fallback={getDefaultFallback(category, fallbackIcon, iconProps, restProps)}
        {...restProps}
      />
    );
  }

  // Check if it's a legacy predefined icon
  const predefinedIcon = PREDEFINED_MARKER_ICONS[iconKey.toLowerCase()];
  if (predefinedIcon) {
    return (
      <DynamicMaterialIcon
        iconName={predefinedIcon}
        iconProps={iconProps}
        fallback={getDefaultFallback(category, fallbackIcon, iconProps, restProps)}
        {...restProps}
      />
    );
  }

  // Try as-is (in case it's already a proper Material-UI icon name)
  return (
    <DynamicMaterialIcon
      iconName={iconKey}
      iconProps={iconProps}
      fallback={getDefaultFallback(category, fallbackIcon, iconProps, restProps)}
      {...restProps}
    />
  );
};

/**
 * Get default fallback component
 */
const getDefaultFallback = (category, fallbackIcon, iconProps, restProps) => {
  const defaultFallbackName = fallbackIcon || CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS.default;
  
  return (
    <DynamicMaterialIcon
      iconName={defaultFallbackName}
      iconProps={iconProps}
      {...restProps}
    />
  );
};

/**
 * Validate if an icon key can be resolved to a Material Icon
 * @param {string} iconKey - The icon key to validate
 * @returns {Promise<boolean>} Whether the icon key is valid
 */
export const validateIconKey = async (iconKey) => {
  if (!iconKey) return false;
  
  // Check if it's a predefined icon
  if (PREDEFINED_MARKER_ICONS[iconKey.toLowerCase()]) {
    return true;
  }
  
  // Try normalizing and validating
  const normalizedIconName = normalizeIconName(iconKey);
  if (normalizedIconName) {
    const { validateMaterialIcon } = await import('../../utils/materialIconLoader');
    return await validateMaterialIcon(normalizedIconName);
  }
  
  // Try as-is
  const { validateMaterialIcon } = await import('../../utils/materialIconLoader');
  return await validateMaterialIcon(iconKey);
};

/**
 * Get suggestions for icon names based on partial input
 * @param {string} query - Partial icon name
 * @param {number} limit - Maximum number of suggestions
 * @returns {string[]} Array of suggested icon names
 */
export const getIconSuggestions = (query, limit = 10) => {
  if (!query || typeof query !== 'string') {
    return Object.values(COMMON_MATERIAL_ICONS).slice(0, limit);
  }
  
  const lowerQuery = query.toLowerCase();
  const suggestions = [];
  
  // Add matching predefined icons
  Object.entries(PREDEFINED_MARKER_ICONS).forEach(([key, value]) => {
    if (key.includes(lowerQuery) || value.toLowerCase().includes(lowerQuery)) {
      suggestions.push(value);
    }
  });
  
  // Add matching common Material Icons
  Object.entries(COMMON_MATERIAL_ICONS).forEach(([key, value]) => {
    if (
      key.toLowerCase().includes(lowerQuery) || 
      value.toLowerCase().includes(lowerQuery)
    ) {
      suggestions.push(value);
    }
  });
  
  // Remove duplicates and limit results
  return [...new Set(suggestions)].slice(0, limit);
};

/**
 * Enhanced marker icon component with additional features
 * @param {Object} props - Component props
 * @param {string} props.iconKey - The icon key/name
 * @param {string} props.size - Icon size ('small', 'medium', 'large', or pixel value)
 * @param {string} props.color - Icon color
 * @param {string} props.category - Category for fallback
 * @param {Function} props.onClick - Click handler
 */
export const MarkerIcon = ({
  iconKey,
  size = 'medium',
  color = 'primary',
  category = 'default',
  onClick = null,
  className = '',
  ...restProps
}) => {
  // Convert size to Material-UI size prop
  const getSizeValue = (size) => {
    switch (size) {
      case 'small': return { fontSize: 16 };
      case 'medium': return { fontSize: 24 };
      case 'large': return { fontSize: 32 };
      default: 
        return typeof size === 'number' ? { fontSize: size } : { fontSize: 24 };
    }
  };

  const iconProps = {
    style: getSizeValue(size),
    color: color,
    className: `marker-icon ${className}`,
    ...(onClick && { onClick }),
  };

  return getMarkerForOption({
    iconKey,
    category,
    iconProps,
    ...restProps,
  });
};

/**
 * Icon picker component for selecting icons
 * @param {Object} props - Component props
 * @param {Function} props.onIconSelect - Callback when icon is selected
 * @param {string} props.selectedIcon - Currently selected icon
 * @param {string[]} props.availableIcons - Custom list of available icons
 */
export const IconPicker = ({
  onIconSelect,
  selectedIcon = '',
  availableIcons = Object.values(COMMON_MATERIAL_ICONS),
  maxDisplay = 20,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [displayedIcons, setDisplayedIcons] = React.useState(availableIcons.slice(0, maxDisplay));

  React.useEffect(() => {
    if (searchQuery) {
      const suggestions = getIconSuggestions(searchQuery, maxDisplay);
      setDisplayedIcons(suggestions);
    } else {
      setDisplayedIcons(availableIcons.slice(0, maxDisplay));
    }
  }, [searchQuery, availableIcons, maxDisplay]);

  return (
    <div className="icon-picker">
      <input
        type="text"
        placeholder="Search icons..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="icon-search"
      />
      
      <div className="icon-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
        gap: '8px',
        marginTop: '16px' 
      }}>
        {displayedIcons.map((iconName) => (
          <div
            key={iconName}
            className={`icon-option ${selectedIcon === iconName ? 'selected' : ''}`}
            onClick={() => onIconSelect(iconName)}
            style={{
              padding: '8px',
              border: selectedIcon === iconName ? '2px solid #326699' : '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'center',
              backgroundColor: selectedIcon === iconName ? '#f0f8ff' : 'white',
            }}
          >
            <MarkerIcon iconKey={iconName} size="medium" />
            <div style={{ fontSize: '10px', marginTop: '4px', wordBreak: 'break-word' }}>
              {iconName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export everything needed
export {
  COMMON_MATERIAL_ICONS,
  CATEGORY_FALLBACKS,
};

export default {
  getMarkerForOption,
  validateIconKey,
  getIconSuggestions,
  MarkerIcon,
  IconPicker,
  PREDEFINED_MARKER_ICONS,
  COMMON_MATERIAL_ICONS,
};