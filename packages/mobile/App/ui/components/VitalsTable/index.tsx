import React, { memo } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table } from '../Table';
import { vitalsTableRows } from './VitalsTableRows';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';

interface VitalsTableProps {
  data: PatientVitalsProps[];
  columns: [];
}

export const VitalsTable = memo(
  ({ data, columns }: VitalsTableProps): JSX.Element => {
    const [survey, surveyError] = useBackendEffect(
      ({ models }) => models.Survey.getRepository().findOne('program-patientvitals-patientvitals'),
      [],
    );

    const [components, componentsError] = useBackendEffect(() => survey && survey.getComponents(), [
      survey,
    ]);

    if (!survey || !components) {
      return null;
    }

    if (surveyError) return <ErrorScreen error={surveyError} />;
    if (componentsError) return <ErrorScreen error={componentsError} />;

    const mobileFormComponents = components.filter(
      c => c.dataElementId !== 'pde-PatientVitalsDate',
    );

    return (
      <Table
        Title={VitalsTableTitle}
        tableHeader={vitalsTableHeader}
        rows={vitalsTableRows(mobileFormComponents)}
        columns={columns}
        cells={data}
      />
    );
  },
);
