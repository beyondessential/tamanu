import React from 'react';
import { DataItem } from './DataItem';

export const renderDataItems = (fields, patient, getLocalisation, fontSize = 9) => {
  return fields.map(({ key, label: defaultLabel, accessor }) => {
    const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
    const label = getLocalisation?.(`fields.${key}.shortLabel`) || defaultLabel;
    return <DataItem label={label} value={value} fontSize={fontSize} key={key} />;
  });
};
