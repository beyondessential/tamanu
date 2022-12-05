import React, { memo } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table } from '../Table';
import { vitalsRows } from './VitalsTableData';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { useBackendEffect } from '~/ui/hooks';

interface VitalsTableProps {
  data: PatientVitalsProps[];
}

export const VitalsTable = memo(
  ({ data }: VitalsTableProps): JSX.Element => {
    const columns = Object.keys(data);

    const [survey, surveyError] = useBackendEffect(({ models }) =>
      models.Survey.getRepository().findOne('program-patientvitals-patientvitals'),
    );

    const [components, componentsError] = useBackendEffect(() => survey && survey.getComponents(), [
      survey,
    ]);

    if (!survey || !components) {
      return null;
    }
    const mobileFormComponents = components.filter(
      c => c.dataElementId !== 'pde-PatientVitalsDate',
    );

    return (
      <Table
        Title={VitalsTableTitle}
        tableHeader={vitalsTableHeader}
        rows={vitalsRows(mobileFormComponents)}
        columns={columns}
        cells={data}
      />
    );
  },
);
