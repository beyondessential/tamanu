import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import { DataFetchingTable } from './DataFetchingTable';

export const SearchTableTitle = styled(Typography)`
  font-size: 14px;
  margin-top: 12px;
  margin-bottom: 8px;
  font-weight: 500;
`;

export const SearchTable = styled(DataFetchingTable)`
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  box-shadow: none;
`;
