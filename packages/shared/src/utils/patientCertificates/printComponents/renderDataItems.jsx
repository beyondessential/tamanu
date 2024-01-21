import React from 'react';
import { DataItem } from './DataItem';

export const renderDataItems = (fields, patient, village, getLocalisation) => {
  console.log('village', village);
  return fields.map(({ key, label: defaultLabel, accessor }) => {
    const label = getLocalisation?.(`fields.${key}.shortLabel`) || defaultLabel;
    if (key === 'villageName') {
      return <DataItem label={label} value={village} key={key} />;
    } else {
      return (
        <DataItem
          label={label}
          value={(accessor ? accessor(patient, getLocalisation) : patient[key]) || ''}
          key={key}
        />
      );
    }
  });
};
