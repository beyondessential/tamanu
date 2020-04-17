import React, { memo } from 'react';
import { Table } from '../Table';
import { vaccineTableCols } from './VaccinesTableColumns';
import { VaccinesTableTitle } from './VaccinesTableTitle';
import { vaccineTableHeader } from './VaccineTableHeader';

interface VaccinesTableProps {
  data: any[];
  onPressItem: (item: any) => void;
}

export const VaccinesTable = memo(({ data, onPressItem }: VaccinesTableProps) => (
  <Table
    onPressItem={onPressItem}
    columns={vaccineTableCols}
    Title={VaccinesTableTitle}
    data={data}
    tableHeader={vaccineTableHeader}
    columnKey="header"
  />
));
