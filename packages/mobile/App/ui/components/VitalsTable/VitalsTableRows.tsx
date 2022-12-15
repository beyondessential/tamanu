import React, { ReactElement } from 'react';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { ISurveyScreenComponent } from '~/types';

type VitalTableRow = {
  rowKey: 'dataElementId';
  rowTitle: string;
  rowHeader: () => ReactElement;
  cell: (cellData: any) => ReactElement;
}

export const vitalsTableRows = (rows: ISurveyScreenComponent[]): VitalTableRow[] => rows.map(r => {
  const validationCriteria = r.getValidationCriteriaObject();
  return {
    rowKey: 'dataElementId',
    rowTitle: r.dataElementId,
    rowHeader: () => <VitalsTableRowHeader title={r.dataElement.name} />,
    cell: (cellData): ReactElement => (
      <VitalsTableCell
        rowKey={r}
        data={cellData}
        validationCriteria={validationCriteria}
        key={cellData?.id || r.id}
      />
    ),
  };
});
