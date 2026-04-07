import React from 'react';

import styled from 'styled-components';
import { DataFetchingTable } from '../../../../components';

export const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;

  .MuiTableCell-body {
    padding-block: 16px;
  }
`;

export function ColourCell({ color }) {
  return color || <>&mdash;</>;
}

export function VisibilityStatusCell({ visibilityStatus }) {
  return visibilityStatus || <>&mdash;</>;
}
