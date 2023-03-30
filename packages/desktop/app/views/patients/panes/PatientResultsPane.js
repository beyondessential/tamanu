import React, { useState } from 'react';

import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../PatientLabTestsTable';
import { ResultsSearchBar } from '../../../components/ResultsSearchBar';

export const PatientResultsPane = React.memo(({ patient }) => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <>
      <ResultsSearchBar setSearchParameters={setSearchParameters} patientId={patient?.id} />
      <ContentPane>
        <PatientLabTestsTable patient={patient} searchParameters={searchParameters} />
      </ContentPane>
    </>
  );
});
