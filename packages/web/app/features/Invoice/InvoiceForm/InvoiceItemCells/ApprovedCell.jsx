import React from 'react';
import { CELL_WIDTHS } from '../../constants';

export const ApprovedCell = ({ item, cellWidths = CELL_WIDTHS }) => (
  <td style={{ minInlineSize: cellWidths.APPROVED }}>{item?.approved ? 'Y' : ''}</td>
);
