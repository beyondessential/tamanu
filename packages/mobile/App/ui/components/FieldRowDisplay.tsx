import React, { ReactElement } from 'react';
import { chunk, keyBy } from 'es-toolkit/compat';
import { isTablet } from 'react-native-device-info';

import { RowView, StyledView } from '../styled/common';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { labels } from '../navigation/screens/home/PatientDetails/labels';
import { useSettings } from '../contexts/SettingsContext';

interface FieldRowDisplayProps {
  fields: string[][];
  customFieldDefinitions?: PatientFieldDefinition[];
}

export const FieldRowDisplay = ({
  fields,
  customFieldDefinitions,
}: FieldRowDisplayProps): ReactElement => {
  const { getSetting } = useSettings();
  const fieldsSetting = getSetting<Record<string, unknown>>('fields');
  const fieldsPerRow = isTablet() ? 2 : 1;
  const rows = chunk(fields, fieldsPerRow);
  const customFieldsById = keyBy(customFieldDefinitions, 'id');

  const getLabel = (name: string) => {
    // Check if it is localised and apply localisation logic
    if (name in fieldsSetting && getSetting<boolean>(`fields.${name}.hidden`)) return null;
    return (
      labels[name] ?? // If there is a label, use it
      customFieldsById[name]?.name ?? // If this is a custom field, grab its label
      name
    );
  };

  return (
    <StyledView style={{ marginRight: 20, marginBottom: 20, marginLeft: 20 }}>
      {rows.map(row => (
        <RowView key={row.map(([name]) => name).join(',')} style={{ marginTop: 20 }}>
          {row.map(([name, info]) => (
            <InformationBox key={name} style={{ flex: 1 }} title={getLabel(name)} info={info} />
          ))}
        </RowView>
      ))}
    </StyledView>
  );
};
