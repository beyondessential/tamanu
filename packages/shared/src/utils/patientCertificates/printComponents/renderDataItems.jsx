import React from 'react';
import { DataItem } from './DataItem';

export const renderDataItems = (fields, patient, getSetting, fontSize = 9) => {
  return fields.map(({ key, label: defaultLabel, accessor }) => {
    const value = (accessor ? accessor(patient, getSetting) : patient[key]) || '';
    const label = getSetting?.(`localisation.fields.${key}.shortLabel`) || defaultLabel;
    return <DataItem label={label} value={value} fontSize={fontSize} key={key} />;
  });
};
