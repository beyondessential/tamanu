import React from 'react';
import { DataItem } from './DataItem';

export const renderDataItems = (fields, patient, getLocalisation) => {
  return fields.map(({ key, label: defaultLabel, accessor }) => {
    const value = (accessor ? accessor(patient, getLocalisation) : patient[key]) || '';
    const label = (getLocalisation ? getLocalisation(`fields.${key}.shortLabel`) : defaultLabel) || defaultLabel;
    return <DataItem label={label} value={value} key={key} />;
  });
};
