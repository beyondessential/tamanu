import React from 'react';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { TableRow } from '../Table';
import { ISurveyScreenComponent } from '~/types';

export const vitalsTableRows = (rows: ISurveyScreenComponent[]): TableRow[] => rows.map(r => {
  const validationCriteria = r.getValidationCriteriaObject();
  return {
    rowKey: 'dataElementId',
    rowTitle: r.dataElementId,
    rowHeader: () => <VitalsTableRowHeader title={r.dataElement.name} />,
    cell: (cellData) => (
      <VitalsTableCell
        data={cellData}
        validationCriteria={validationCriteria}
        key={cellData?.id || r.id}
      />
    ),
  };
});
