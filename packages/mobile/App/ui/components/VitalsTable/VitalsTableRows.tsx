import React, { ReactElement } from 'react';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';

export const vitalsTableRows = rows =>
  rows.map(r => ({
    rowKey: 'dataElementId',
    rowTitle: r.dataElementId,
    rowHeader: (): ReactElement => <VitalsTableRowHeader title={r.dataElement.name} />,
    cell: (cellData): ReactElement => (
      <VitalsTableCell rowKey={r} data={cellData} key={cellData?.id || r.id} />
    ),
  }));
