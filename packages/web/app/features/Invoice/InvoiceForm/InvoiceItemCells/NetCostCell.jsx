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
  const netCost = getInvoiceItemNetCost(item);
  const showValue = Boolean(item.productId);

  return <Cell $width={cellWidths.NET_COST}>{showValue && <Price price={netCost} />}</Cell>;
};
