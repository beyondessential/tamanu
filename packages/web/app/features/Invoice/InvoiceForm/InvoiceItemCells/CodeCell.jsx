import React from 'react';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';

export const CodeCell = ({ item, isItemEditable }) => {
  let productCode = item.productCodeFinal || item.productCode || null;
  if (!isItemEditable && !productCode) {
    productCode = 'N/A';
  }
  return (
    <ItemCell width="15%">
      <ViewOnlyCell>{productCode}</ViewOnlyCell>
    </ItemCell>
  );
};
