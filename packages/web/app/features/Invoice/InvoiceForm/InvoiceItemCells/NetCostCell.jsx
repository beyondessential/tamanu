import React from 'react';
import styled from 'styled-components';
import { getInvoiceItemNetCost } from '@tamanu/utils/invoice';
import { ItemCell } from './ItemCell';
import { Price } from '../../Price';
import { CELL_WIDTHS } from '../../constants';

const Cell = styled(ItemCell)`
  display: flex;
  justify-content: flex-end;
`;

export const NetCostCell = ({ item, cellWidths = CELL_WIDTHS }) => {
  return (
    <Cell $width={cellWidths.NET_COST}>
      {item.productId ? <Price price={getInvoiceItemNetCost(item)} /> : null}
    </Cell>
  );
};
