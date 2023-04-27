import React, { useState } from 'react';

import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../PatientLabTestsTable';
import { ResultsSearchBar } from '../../../components/ResultsSearchBar';

export const PatientResultsPane = React.memo(({ patient }) => {
  const [searchParameters, setSearchParameters] = useState({ panelId: '', categoryId: '' });
  return (
    <>
      <ResultsSearchBar
        searchParameters={searchParameters}
        setSearchParameters={setSearchParameters}
        patientId={patient?.id}
      />
      <ContentPane>
        {(searchParameters.categoryId || searchParameters.panelId) && (
          <PatientLabTestsTable patient={patient} searchParameters={searchParameters} />
        )}
      </ContentPane>
    </>
  );
});
