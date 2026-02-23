import React from 'react';
import { getInvoiceItemNetCost } from '@tamanu/utils/invoice';
import { ItemCell } from './ItemCell';
import { Price } from '../../Price';
import { CELL_WIDTHS } from '../../constants';

export const NetCostCell = ({ item }) => {
  const netCost = getInvoiceItemNetCost(item);

  return (
    <ItemCell $width={CELL_WIDTHS.NET_COST} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Price price={netCost} />
    </ItemCell>
  );
};
