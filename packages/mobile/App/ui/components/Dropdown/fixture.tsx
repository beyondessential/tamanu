import React, { useState } from 'react';
import { Dropdown } from './index';

export const dropdownItems = [
  { label: 'Clinic', value: 'clinic' },
  { label: 'Visit', value: 'visit' },
  { label: 'Hospital', value: 'hospital' },
];

export const label = 'Type';

export function BaseStory(): JSX.Element {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <Dropdown
      label={label}
      options={dropdownItems}
      onChange={setSelectedItem}
      value={selectedItem}
      onPress={() => {}}
    />
  );
}
