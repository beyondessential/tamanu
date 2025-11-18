import React from 'react';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';

export const CodeCell = ({ item }) => (
  <ItemCell width="10%">
    <ViewOnlyCell>{item.productCode}</ViewOnlyCell>
  </ItemCell>
);
