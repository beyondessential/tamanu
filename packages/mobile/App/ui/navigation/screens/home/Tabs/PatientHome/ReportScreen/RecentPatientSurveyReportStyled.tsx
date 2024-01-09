import React, { FC } from 'react';
import styled from 'styled-components/native';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

export const Table = styled.View`
  display: flex;
`;

export const Row = styled.View`
  max-width: 100%;
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  
`;

export const HeaderRow = styled(Row)`
  padding-bottom: 4px;
`;

export const BorderRow = styled(Row)`
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.PRIMARY_MAIN}
`;

export const ColumnCategory = styled.View`
  display: flex;
  width: 25%;
  flex-flow: row;
  align-items: center;
  padding-left: 4px;
`;
export const Cell = styled.View`
  display: flex;
  width: 25%;
  flex-grow: 1;
  flex-flow: column;
  align-items: center;
`;

export const DataText = styled(StyledText)<{type?: 'strong' | 'regular'}>`
  font-size: ${(p): number => screenPercentageToDP((p.type === 'strong' ? 1.8 : 1.7), Orientation.Height)};
  font-weight: ${(p): number => (p.type === 'strong' ? 700 : 500)};
  color: ${(p): string => (p.type === 'strong' ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_DARK)};
`;

type DataCellProps = {
  type?: 'strong' | 'regular';
}

export const DataCell: FC<DataCellProps> = ({ children, type = 'regular' }) => (
  <Cell>
    <DataText type={type}>{children}</DataText>
  </Cell>
);
