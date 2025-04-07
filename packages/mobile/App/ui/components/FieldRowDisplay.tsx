import React, { ReactElement } from 'react';
import { chunk, keyBy } from 'lodash';
import { isTablet } from 'react-native-device-info';

import { RowView, StyledView } from '../styled/common';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { labels } from '../navigation/screens/home/PatientDetails/layouts/generic/labels';
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
  const localisedFields = Object.keys(getSetting('fields'));
  const fieldsPerRow = isTablet() ? 2 : 1;
  const rows = chunk(fields, fieldsPerRow);
  const customFieldsById = keyBy(customFieldDefinitions, 'id');

  const getLabel = (name: string) => {
    // Check if it is localised and apply localisation logic
    if (localisedFields.includes(name) && getSetting<boolean>(`fields.${name}.hidden`)) {
      return null;
    }

    // Check if there is a label and use if so
    if (Object.keys(labels).includes(name)) {
      return labels[name];
    }

    // Check if this is a custom field and grab the label if so
    if (Object.keys(customFieldsById).includes(name)) {
      return customFieldsById[name]?.name;
    }
    return name;
  };

  return (
    <StyledView width="100%" margin={20} marginTop={0}>
      {rows.map((row) => (
        <RowView key={row.map(([name]) => name).join(',')} marginTop={20}>
          {row.map(([name, info]) => (
            <InformationBox key={name} flex={1} title={getLabel(name)} info={info} />
          ))}
        </RowView>
      ))}
    </StyledView>
  );
};
