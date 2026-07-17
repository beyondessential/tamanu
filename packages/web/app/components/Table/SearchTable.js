import { Typography } from '@material-ui/core';
import styled, { css } from 'styled-components';
import { DataFetchingTable, DataFetchingTableWithPermissionCheck } from './DataFetchingTable';

export const SearchTableTitle = styled(Typography)`
  font-size: 14px;
  margin-block: 12px 8px;
  font-weight: 500;
`;

const styles = css`
  border-block-start: none;
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: none;
`;

export const SearchTable = styled(DataFetchingTable)(styles);

export const SearchTableWithPermissionCheck = styled(DataFetchingTableWithPermissionCheck)(styles);
