import React, { useState } from 'react';
import { getMarkerForOption, MarkerIcon, IconPicker, validateIconKey } from './markerIcons';

/**
 * Example component demonstrating the enhanced icon system
 * This shows how to use any Material Icons instead of just a predefined set
 */
const IconUsageExample = () => {
  const [selectedIcon, setSelectedIcon] = useState('LocationOn');
  const [customIconKey, setCustomIconKey] = useState('');
  const [isIconValid, setIsIconValid] = useState(null);

  // Example of using various Material Icons
  const exampleIcons = [
    // Legacy predefined icons (still work)
    'hospital',
    'pharmacy', 
    'location',
    
    // Any Material-UI icons (new capability)
    'LocationOn',
    'LocalHospital',
    'School',
    'Restaurant', 
    'ShoppingCart',
    'DirectionsBus',
    'Park',
    'Business',
    'Apartment',
    'Train',
    'Flight',
    'Hotel',
    'SportsSoccer',
    'Mosque',
    'Church',
    'Synagogue',
    'ChildCare',
    'LocalGasStation',
    'LocalAtm',
    'LocalLaundryService',
    'LocalCarWash',
    'LocalCafe',
    'LocalBar',
    'MusicNote',
    'MovieCreation',
    'FitnessCenter',
    'Spa',
    'AccountBalance',
    'MonetizationOn',
  ];

  const handleIconValidation = async (iconKey) => {
    if (!iconKey.trim()) {
      setIsIconValid(null);
      return;
    }
    
    try {
      const valid = await validateIconKey(iconKey);
      setIsIconValid(valid);
    } catch (error) {
      console.error('Error validating icon:', error);
      setIsIconValid(false);
    }
  };

  React.useEffect(() => {
    if (customIconKey) {
      const timeoutId = setTimeout(() => {
        handleIconValidation(customIconKey);
      }, 500); // Debounce validation
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsIconValid(null);
    }
  }, [customIconKey]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Enhanced Material Icons Usage Example</h2>
      
      {/* Basic usage examples */}
      <section style={{ marginBottom: '30px' }}>
        <h3>Basic Icon Usage</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {exampleIcons.slice(0, 12).map((iconKey) => (
            <div key={iconKey} style={{ textAlign: 'center', minWidth: '80px' }}>
              <div style={{ marginBottom: '5px' }}>
                {getMarkerForOption({ iconKey, iconProps: { style: { fontSize: 32 } } })}
              </div>
              <div style={{ fontSize: '12px', wordBreak: 'break-word' }}>{iconKey}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced MarkerIcon component */}
      <section style={{ marginBottom: '30px' }}>
        <h3>Enhanced MarkerIcon Component</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h4>Different Sizes:</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <MarkerIcon iconKey="LocalHospital" size="small" />
              <MarkerIcon iconKey="LocalHospital" size="medium" />
              <MarkerIcon iconKey="LocalHospital" size="large" />
              <MarkerIcon iconKey="LocalHospital" size={48} />
            </div>
          </div>
          
          <div>
            <h4>Different Colors:</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <MarkerIcon iconKey="Favorite" color="primary" />
              <MarkerIcon iconKey="Favorite" color="secondary" />
              <MarkerIcon iconKey="Favorite" color="error" />
              <MarkerIcon iconKey="Favorite" color="action" />
            </div>
          </div>
        </div>
      </section>

      {/* Custom icon input */}
      <section style={{ marginBottom: '30px' }}>
        <h3>Try Any Material Icon</h3>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter any Material-UI icon name (e.g., FlightTakeoff, Computer, Face)"
            value={customIconKey}
            onChange={(e) => setCustomIconKey(e.target.value)}
            style={{
              padding: '10px',
              width: '400px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginRight: '10px',
            }}
          />
          
          {isIconValid !== null && (
            <span style={{ 
              color: isIconValid ? 'green' : 'red',
              fontWeight: 'bold'
            }}>
              {isIconValid ? '✓ Valid icon' : '✗ Icon not found'}
            </span>
          )}
        </div>
        
        {customIconKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong>Preview:</strong>
            <MarkerIcon iconKey={customIconKey} size="large" />
            <span>{customIconKey}</span>
          </div>
        )}
      </section>

      {/* Icon picker */}
      <section style={{ marginBottom: '30px' }}>
        <h3>Icon Picker Component</h3>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <p><strong>Selected Icon:</strong> {selectedIcon}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <MarkerIcon iconKey={selectedIcon} size="large" />
            <span>{selectedIcon}</span>
          </div>
          
          <IconPicker
            onIconSelect={setSelectedIcon}
            selectedIcon={selectedIcon}
            maxDisplay={24}
          />
        </div>
      </section>

      {/* Migration guide */}
      <section style={{ marginBottom: '30px' }}>
        <h3>Migration Guide</h3>
        <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h4>Before (Limited Icons):</h4>
          <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}>
{`// Only predefined icons were supported
const icons = {
  hospital: 'hospital-icon',
  pharmacy: 'pharmacy-icon',
  // ... limited set
};

getMarkerForOption({ iconKey: 'hospital' }); // ✓ Works
getMarkerForOption({ iconKey: 'FlightTakeoff' }); // ✗ Fails`}
          </pre>

          <h4>After (Any Material Icons):</h4>
          <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}>
{`// Any Material-UI icon is now supported!
getMarkerForOption({ iconKey: 'hospital' }); // ✓ Still works (backward compatible)
getMarkerForOption({ iconKey: 'FlightTakeoff' }); // ✓ Now works!
getMarkerForOption({ iconKey: 'Computer' }); // ✓ Now works!
getMarkerForOption({ iconKey: 'MusicNote' }); // ✓ Now works!

// Enhanced component with more features
<MarkerIcon iconKey="FlightTakeoff" size="large" color="primary" />

// Validate icons programmatically
const isValid = await validateIconKey('FlightTakeoff'); // true

// Get icon suggestions
const suggestions = getIconSuggestions('flight'); // ['Flight', 'FlightTakeoff', 'FlightLand']`}
          </pre>
        </div>
      </section>

      <section>
        <h3>Benefits of Enhanced System</h3>
        <ul>
          <li><strong>Unlimited Icons:</strong> Use any of the 1000+ Material-UI icons</li>
          <li><strong>Backward Compatible:</strong> Existing predefined icons still work</li>
          <li><strong>Dynamic Loading:</strong> Icons are loaded on-demand for performance</li>
          <li><strong>Validation:</strong> Check if icon names are valid before using</li>
          <li><strong>Fallback System:</strong> Graceful degradation with fallback icons</li>
          <li><strong>Search & Discovery:</strong> Icon picker with search functionality</li>
          <li><strong>Type Normalization:</strong> Handles various icon name formats</li>
        </ul>
      </section>
    </div>
  );
};

export default IconUsageExample;