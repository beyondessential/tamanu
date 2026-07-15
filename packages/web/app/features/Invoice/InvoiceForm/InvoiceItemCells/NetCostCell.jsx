import React from 'react';
import { getInvoiceItemNetCost } from '@tamanu/utils/invoice';
import { Price } from '../../Price';
import { CELL_WIDTHS } from '../../constants';

export const NetCostCell = ({ item, cellWidths = CELL_WIDTHS }) => {
  return (
    <td style={{ minInlineSize: cellWidths.NET_COST, textAlign: 'end' }}>
      {item.productId ? <Price price={getInvoiceItemNetCost(item)} /> : null}
    </td>
  );
};
