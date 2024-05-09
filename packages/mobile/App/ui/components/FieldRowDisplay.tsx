import React, { ReactElement } from 'react';
import { chunk, keyBy } from 'lodash';
import { isTablet } from 'react-native-device-info';

import { useLocalisation } from '../contexts/LocalisationContext';
import { RowView, StyledView } from '../styled/common';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';
import { IPatientFieldDefinition } from '~/types';
import { isCustomField } from '../helpers/fields';

interface FieldRowDisplayProps {
  fields: string[][];
  customFieldDefinitions?: IPatientFieldDefinition[];
}

export const FieldRowDisplay = ({
  fields,
  customFieldDefinitions,
}: FieldRowDisplayProps): ReactElement => {
  const { getString, getBool, getLocalisation } = useLocalisation();
  const localisedFields = Object.keys(getLocalisation('fields'));
  const fieldsPerRow = isTablet() ? 2 : 1;
  const rows = chunk(fields, fieldsPerRow);
  const customFieldsById = keyBy(customFieldDefinitions, 'id');
  const customFieldIds = Object.keys(customFieldsById);

  const getLabel = (name: string) => {
    if (localisedFields.includes(name)) {
      if (getBool(`fields.${name}.hidden`)) return null;
      return getString(`fields.${name}.longLabel`);
    }

    if (isCustomField(name)) {
      return customFieldsById[name]?.name;
    }
    
    return name;
  };

  return (
    <StyledView width="100%" margin={20} marginTop={0}>
      {rows.map(row => (
        <RowView key={row.map(([name]) => name).join(',')} marginTop={20}>
          {row.map(([name, info]) => (
            <InformationBox key={name} flex={1} title={getLabel(name)} info={info} />
          ))}
        </RowView>
      ))}
    </StyledView>
  );
};
