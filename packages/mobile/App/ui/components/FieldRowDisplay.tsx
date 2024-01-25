import React, { ReactElement } from 'react';
import { chunk } from 'lodash';
import { isTablet } from 'react-native-device-info';

import { useSettings } from '../contexts/SettingContext';
import { RowView, StyledView } from '../styled/common';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';

interface FieldRowDisplayProps {
  fields: string[][];
  isCustomFields?: boolean;
}

export const FieldRowDisplay = ({ fields, isCustomFields }: FieldRowDisplayProps): ReactElement => {
  const { getSetting } = useSettings();
  const visibleFields = isCustomFields
    ? fields
    : fields.filter(([name]) => getSetting<boolean>(`fields.${name}.hidden`) !== true);
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
              title={isCustomFields ? name : getSetting<string>(`fields.${name}.longLabel`)}
              info={info}
            />
          ))}
        </RowView>
      ))}
    </StyledView>
  );
};
