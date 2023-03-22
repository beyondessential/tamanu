import React from 'react';

import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../../../components/PatientLabTestsTable';

export const PatientResultsPane = React.memo(({ patient }) => {
  return (
    <ContentPane>
      {/* TODO Add filter dropdowns */}
      <PatientLabTestsTable patientId={patient.id} />
    </ContentPane>
  );
});
