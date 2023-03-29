import React, { useState } from 'react';

import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../../../components/PatientLabTestsTable';
import { ResultsSearchBar } from '../../../components/ResultsSearchBar';
import { LabTestResultModal } from '../../../components/LabTestResultModal';

export const PatientResultsPane = React.memo(({ patient }) => {
  const [searchParameters, setSearchParameters] = useState({});
  const [modalLabTestId, setModalLabTestId] = useState();

  return (
    <>
      <ResultsSearchBar setSearchParameters={setSearchParameters} patientId={patient?.id} />
      <ContentPane>
        <PatientLabTestsTable
          patient={patient}
          searchParameters={searchParameters}
          openResultsModal={id => setModalLabTestId(id)}
        />
      </ContentPane>
      <LabTestResultModal
        open={modalLabTestId}
        onClose={() => setModalLabTestId(null)}
        labTestId={modalLabTestId}
      />
    </>
  );
});
