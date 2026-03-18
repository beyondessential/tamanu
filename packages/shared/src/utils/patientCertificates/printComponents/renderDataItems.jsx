import React from 'react';
import { DataItem } from './DataItem';

export const renderDataItems = (fields, patient, {getTranslation, getSetting, formatShort, formatShortExplicit, formatTime}, fontSize = 9) => {
  return fields.map(({ key, label: defaultLabel, accessor }) => {
    const value =
      (accessor ? accessor(patient, { getTranslation, getSetting, formatShort, formatShortExplicit, formatTime }) : patient[key]) || '';
    const label =
      getTranslation(`general.localisedField.${key}.label.short`) ||
      getTranslation(`general.localisedField.${key}.label`) ||
      defaultLabel;
    return <DataItem label={label} value={value} fontSize={fontSize} key={key} />;
  });
};
