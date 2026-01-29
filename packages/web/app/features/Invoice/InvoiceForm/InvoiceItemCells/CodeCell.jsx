import React from 'react';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';

export const CodeCell = ({ item, isItemEditable }) => {
  let productCode = item.productCodeFinal || item.productCode || null;
  if (!isItemEditable && !productCode) {
    productCode = 'N/A';
  }
  return (
    <ItemCell $width={CELL_WIDTHS.CODE}>
      <ViewOnlyCell>{productCode}</ViewOnlyCell>
    </ItemCell>
  );
};
