import { isNil } from 'lodash';
import { useState } from 'react';

export const useTableSorting = ({ initialSortKey, initialSortDirection }) => {
  const [orderBy, setOrderBy] = useState(initialSortKey);
  const [order, setOrder] = useState(initialSortDirection);

  const customSort = (data = []) => {
    const ascComparator = (aReport, bReport) => {
      const a = aReport[orderBy];
      const b = bReport[orderBy];
      if (isNil(a) || isNil(b)) {
        return (isNil(a) ? -1 : 1) - (isNil(b) ? -1 : 1);
      }
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      return `${a}`.localeCompare(`${b}`);
    };
    const descComparator = (a, b) => ascComparator(b, a);
    return data.sort(order === 'asc' ? ascComparator : descComparator);
  };

  const onChangeOrderBy = sortKey => {
    setOrderBy(sortKey);
    const isDesc = orderBy === sortKey && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
  };

  return { orderBy, order, onChangeOrderBy, customSort };
};
