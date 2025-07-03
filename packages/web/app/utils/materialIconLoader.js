import React, { lazy, Suspense } from 'react';

// Cache for dynamically loaded icons to avoid re-importing
const iconCache = new Map();

/**
 * Dynamically loads a Material-UI icon component by name
 * @param {string} iconName - The name of the Material-UI icon (e.g., 'Home', 'Settings', 'LocationOn')
 * @returns {React.Component|null} The icon component or null if not found
 */
export const loadMaterialIcon = (iconName) => {
  if (!iconName || typeof iconName !== 'string') {
    console.warn('Invalid icon name provided to loadMaterialIcon:', iconName);
    return null;
  }

  // Check cache first
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName);
  }

  try {
    // Dynamically import the icon
    const IconComponent = lazy(() =>
      import(`@material-ui/icons/${iconName}`)
        .then((module) => ({ default: module.default }))
        .catch((error) => {
          console.warn(`Failed to load Material-UI icon: ${iconName}`, error);
          // Return a fallback icon component
          return import('@material-ui/icons/Help').then((module) => ({ default: module.default }));
        })
    );

    // Cache the component
    iconCache.set(iconName, IconComponent);
    return IconComponent;
  } catch (error) {
    console.error(`Error loading Material-UI icon: ${iconName}`, error);
    return null;
  }
};

/**
 * A wrapper component that renders any Material-UI icon with fallback
 * @param {Object} props - Component props
 * @param {string} props.iconName - The name of the Material-UI icon
 * @param {Object} props.iconProps - Props to pass to the icon component
 * @param {React.Component} props.fallback - Fallback component while loading
 */
export const DynamicMaterialIcon = ({ 
  iconName, 
  iconProps = {}, 
  fallback = null,
  ...restProps 
}) => {
  const IconComponent = loadMaterialIcon(iconName);

  if (!IconComponent) {
    return fallback;
  }

  return (
    <Suspense fallback={fallback}>
      <IconComponent {...iconProps} {...restProps} />
    </Suspense>
  );
};

/**
 * Validates if an icon name exists in Material-UI icons
 * @param {string} iconName - The name of the icon to validate
 * @returns {Promise<boolean>} Whether the icon exists
 */
export const validateMaterialIcon = async (iconName) => {
  if (!iconName || typeof iconName !== 'string') {
    return false;
  }

  try {
    await import(`@material-ui/icons/${iconName}`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Common Material-UI icon names for quick reference
 * This is a subset of available icons - the full list is much larger
 */
export const COMMON_MATERIAL_ICONS = {
  // Navigation
  HOME: 'Home',
  MENU: 'Menu',
  ARROW_BACK: 'ArrowBack',
  ARROW_FORWARD: 'ArrowForward',
  CLOSE: 'Close',
  
  // Actions
  ADD: 'Add',
  EDIT: 'Edit',
  DELETE: 'Delete',
  SAVE: 'Save',
  SEARCH: 'Search',
  REFRESH: 'Refresh',
  
  // Communication
  EMAIL: 'Email',
  PHONE: 'Phone',
  MESSAGE: 'Message',
  NOTIFICATIONS: 'Notifications',
  
  // Content
  COPY: 'FileCopy',
  CUT: 'Cut',
  PASTE: 'Paste',
  DOWNLOAD: 'GetApp',
  UPLOAD: 'Publish',
  
  // Maps & Location
  LOCATION_ON: 'LocationOn',
  LOCATION_OFF: 'LocationOff',
  MAP: 'Map',
  PLACE: 'Place',
  ROOM: 'Room',
  
  // Medical/Health
  LOCAL_HOSPITAL: 'LocalHospital',
  HEALING: 'Healing',
  MEDICATION: 'LocalPharmacy',
  FAVORITE: 'Favorite',
  HEART: 'FavoriteOutlined',
  
  // Status & Alerts
  CHECK: 'Check',
  CHECK_CIRCLE: 'CheckCircle',
  ERROR: 'Error',
  WARNING: 'Warning',
  INFO: 'Info',
  
  // Media
  PLAY_ARROW: 'PlayArrow',
  PAUSE: 'Pause',
  STOP: 'Stop',
  VOLUME_UP: 'VolumeUp',
  
  // Data & Analytics
  ASSESSMENT: 'Assessment',
  BAR_CHART: 'BarChart',
  PIE_CHART: 'PieChart',
  TRENDING_UP: 'TrendingUp',
  
  // File & Folder
  FOLDER: 'Folder',
  FILE: 'InsertDriveFile',
  DESCRIPTION: 'Description',
  
  // Settings
  SETTINGS: 'Settings',
  ACCOUNT_CIRCLE: 'AccountCircle',
  SECURITY: 'Security',
  
  // Time
  ACCESS_TIME: 'AccessTime',
  TODAY: 'Today',
  DATE_RANGE: 'DateRange',
  SCHEDULE: 'Schedule',
};

/**
 * Get icon name from various input formats
 * @param {string} input - Input that could be icon name, key, etc.
 * @returns {string} Normalized icon name
 */
export const normalizeIconName = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // If it's already a valid Material-UI icon name format
  if (/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
    return input;
  }

  // Convert kebab-case or snake_case to PascalCase
  return input
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

export default {
  loadMaterialIcon,
  DynamicMaterialIcon,
  validateMaterialIcon,
  COMMON_MATERIAL_ICONS,
  normalizeIconName,
};