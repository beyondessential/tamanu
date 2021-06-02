import React from 'react';
import { chunk } from 'lodash';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { StyledView, RowView } from '~/ui/styled/common';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { InformationBox } from '~/ui/navigation/screens/home/PatientDetails/CustomComponents';

interface FieldRowDisplayProps {
  fields: string[][];
  header?: string;
  fieldsPerRow: number;
}

export const FieldRowDisplay = ({
  fields,
  header,
  fieldsPerRow,
}: FieldRowDisplayProps): JSX.Element => {
  const { getString, getBool } = useLocalisation();
  const visibleFields = fields.filter(([name]) => getBool(`fields.${name}.hidden`) !== true);
  const rows = chunk(visibleFields, fieldsPerRow);

  return (
    <StyledView width="100%">
      {header && (
        <SectionHeader h1 fontWeight={500}>
          {header}
        </SectionHeader>
      )}
      {rows.map(row => (
        <RowView key={row.map(([name]) => name).join(',')} marginTop={20}>
          {row.map(([name, defaultTitle, info]) => (
            <InformationBox
              key={name}
              flex={1}
              title={getString(`fields.${name}.longLabel`, defaultTitle)}
              info={info}
            />
          ))}
        </RowView>
      ))}
    </StyledView>
  );
};
