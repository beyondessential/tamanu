import React from 'react';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';

export const ApprovedCell = ({ item, cellWidths = CELL_WIDTHS }) => (
    <ItemCell $width={cellWidths.APPROVED}>
        <ViewOnlyCell>{item?.approved ? 'Y' : ''}</ViewOnlyCell>
    </ItemCell>
);
