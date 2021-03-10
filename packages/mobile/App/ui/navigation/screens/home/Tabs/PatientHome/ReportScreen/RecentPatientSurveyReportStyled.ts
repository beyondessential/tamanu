import styled from 'styled-components/native';
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
