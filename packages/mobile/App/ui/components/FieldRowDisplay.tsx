import React from 'react';
import { chunk } from 'lodash';
import { isTablet } from 'react-native-device-info';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { StyledView, RowView } from '~/ui/styled/common';
import { InformationBox } from '~/ui/navigation/screens/home/PatientDetails/CustomComponents';

interface FieldRowDisplayProps {
  fields: string[][];
}

export const FieldRowDisplay = ({
  fields,
}: FieldRowDisplayProps): JSX.Element => {
  const { getString, getBool } = useLocalisation();
  const visibleFields = fields.filter(([name]) => getBool(`fields.${name}.hidden`) !== true);
  const fieldsPerRow = isTablet() ? 2 : 1;
  const rows = chunk(visibleFields, fieldsPerRow);

  return (
    <StyledView width="100%" margin={20} marginTop={0}>
      {rows.map(row => (
        <RowView key={row.map(([name]) => name).join(',')} marginTop={20}>
          {row.map(([name, info]) => (
            <InformationBox
              key={name}
              flex={1}
              title={getString(`fields.${name}.longLabel`)}
              info={info}
            />
          ))}
        </RowView>
      ))}
    </StyledView>
  );
};
