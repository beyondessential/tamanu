import React, { useState } from 'react';

import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../../../components/PatientLabTestsTable';
import { ResultsSearchBar } from '../../../components/ResultsSearchBar';
import { LabTestResultModal } from '../../../components/LabTestResultModal';

export const PatientResultsPane = React.memo(({ patient }) => {
  const [searchParameters, setSearchParameters] = useState({});
  const [modalLabTestId, setModalLabTestId] = useState();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <ResultsSearchBar setSearchParameters={setSearchParameters} patientId={patient?.id} />
      <ContentPane>
        <PatientLabTestsTable
          patient={patient}
          searchParameters={searchParameters}
          openResultsModal={id => {
            setModalLabTestId(id);
            setModalOpen(true);
          }}
        />
      </ContentPane>
      <LabTestResultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        labTestId={modalLabTestId}
      />
    </>
  );
});
