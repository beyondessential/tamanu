import React from 'react';
import { chunk } from 'lodash';

import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { InformationBox } from '../navigation/screens/home/PatientDetails/CustomComponents';

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
  const rows = chunk(fields, fieldsPerRow);

  return (
    <StyledView width="100%">
      {header && (
        <SectionHeader h1 fontWeight={500}>
          {header}
        </SectionHeader>
      )}
      {rows.map(row => (
        <RowView key={`${row[0]}${row[1]}`} marginTop={20}>
          {row.map(([title, info]) => (
            <InformationBox
              key={title}
              flex={1}
              title={title}
              info={info}
            />
          ))}
        </RowView>
      ))}
    </StyledView>
  );
};
