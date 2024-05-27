import React, { ReactElement } from 'react';
import { chunk, keyBy } from 'lodash';
import { isTablet } from 'react-native-device-info';

import { useLocalisation } from '../contexts/LocalisationContext';
import { RowView, StyledView } from '../styled/common';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { useTranslation } from '../contexts/TranslationContext';

interface FieldRowDisplayProps {
  fields: string[][];
  customFieldDefinitions?: PatientFieldDefinition[];
}

export const FieldRowDisplay = ({
  fields,
  customFieldDefinitions,
}: FieldRowDisplayProps): ReactElement => {
  const { getBool, getLocalisation } = useLocalisation();
  const { getTranslation } = useTranslation();
  const localisedFields = Object.keys(getLocalisation('fields'));
  const fieldsPerRow = isTablet() ? 2 : 1;
  const rows = chunk(fields, fieldsPerRow);
  const customFieldsById = keyBy(customFieldDefinitions, 'id');

  const getLabel = (name: string) => {
    // Check if it is localised and apply localisation logic
    if (localisedFields.includes(name)) {
      if (getBool(`fields.${name}.hidden`)) return null;
      return getTranslation(
        `general.localisedField.${name}`,
        getLocalisation(`fields.${name}.longLabel`), // TODO: Temporary until getLocalisation label logic completely replaced
      );
    }

    // Check if this is a custom field and grab the label if so
    if (Object.keys(customFieldsById).includes(name)) {
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
