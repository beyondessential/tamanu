import React from 'react';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';

export const CodeCell = ({ item }) => (
  <ItemCell width="15%">
    <ViewOnlyCell>{item.productCodeFinal || item.productCode}</ViewOnlyCell>
  </ItemCell>
);
