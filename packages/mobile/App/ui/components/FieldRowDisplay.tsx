import React, { ReactElement, } from 'react';
import { chunk, keyBy } from 'lodash';
import { isTablet } from 'react-native-device-info';

import { useLocalisation } from '../contexts/LocalisationContext';
import { RowView, StyledView } from '../styled/common';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';
import { IPatientFieldDefinition } from '~/types';

interface FieldRowDisplayProps {
  fields: string[][];
  customFieldDefinitions?: IPatientFieldDefinition[];
}

export const FieldRowDisplay = ({ fields, customFieldDefinitions }: FieldRowDisplayProps): ReactElement => {
  const { getString, getBool, getLocalisation } = useLocalisation();
  const localisedFields = getLocalisation('fields');
  const fieldsPerRow = isTablet() ? 2 : 1;
  const rows = chunk(fields, fieldsPerRow);
  const customFieldsById = keyBy(customFieldDefinitions, 'id')

  return (
    <StyledView width="100%" margin={20} marginTop={0}>
      {rows.map(row => (
        <RowView key={row.map(([name]) => name).join(',')} marginTop={20}>
          {row.map(([name, info]) => {
            let title = name;

            const isLocalised = Object.keys(localisedFields).includes(name);
            if (isLocalised) {
              if (getBool(`fields.${name}.hidden`)) return null;
              title = getString(`fields.${name}.longLabel`);
            }

            const isCustom = name.startsWith('fieldDefinition');
            if (isCustom) {
              title = customFieldsById[name]?.name
            }


            return (
              <InformationBox
                key={name}
                flex={1}
                title={title}
                info={info}
              />
            );
          })}
        </RowView>
      ))}
    </StyledView>
  );
};
