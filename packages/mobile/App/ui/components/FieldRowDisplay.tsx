import React, { ReactElement, } from 'react';
import { chunk, keyBy } from 'lodash';
import { isTablet } from 'react-native-device-info';

import { useLocalisation } from '../contexts/LocalisationContext';
import { RowView, StyledView } from '../styled/common';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';

interface FieldRowDisplayProps {
  fields: string[][];
  customFields?: ReactElement;
}

export const FieldRowDisplay = ({ fields, customFields }: FieldRowDisplayProps): ReactElement => {
  const { getString, getBool, getLocalisation } = useLocalisation();
  const localisedFields = getLocalisation('fields');
  const fieldsPerRow = isTablet() ? 2 : 1;
  const rows = chunk(fields, fieldsPerRow);

  const customFieldsById = keyBy(customFields, 'id')

  return (
    <StyledView width="100%" margin={20} marginTop={0}>
      {rows.map(row => (
        <RowView key={row.map(([name]) => name).join(',')} marginTop={20}>
          {row.map(([name, info]) => {
            const isLocalised = Object.keys(localisedFields).includes(name);
            if (isLocalised && getBool(`fields.${name}.hidden`)) return null;

            const isCustom = name.startsWith('fieldDefinition');

            let title = name;
            if (isLocalised) {
              title = getString(`fields.${name}.longLabel`);
            }
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
