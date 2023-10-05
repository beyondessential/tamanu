import React from 'react';
import styled from 'styled-components';

import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../PatientLabTestsTable';
import { ResultsSearchBar } from '../../../components/ResultsSearchBar';
import { usePatientLabTestResults } from '../../../api/queries/usePatientLabTestResults';
import { Colors } from '../../../constants';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { usePatientSearchParameters } from '../../../contexts/PatientViewSearchParameters';
import { useAuth } from '../../../contexts/Auth';

const NoResultContainer = styled.div`
  padding: 30px;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
`;

const NoResultsInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border-radius: 3px;
  background: ${Colors.background};
  color: ${Colors.primary};
  font-weight: 500;
  text-align: center;
  padding: 70px 190px;
`;

const WrongPermissionInner = styled(NoResultsInner)`
  color: ${Colors.alert};
`;

const NoResultsMessage = () => (
  <NoResultContainer>
    <NoResultsInner>
      This patient has no lab results to display. Once lab results are available they will be
      displayed here.
    </NoResultsInner>
  </NoResultContainer>
);

const WrongPermissionMessage = () => (
  <NoResultContainer>
    <WrongPermissionInner>You do not have permission to view lab results</WrongPermissionInner>
  </NoResultContainer>
);

export const PatientResultsPane = React.memo(({ patient }) => {
  const { ability } = useAuth();
  const {
    labResultParameters: searchParameters,
    setLabResultParameters: setSearchParameters,
  } = usePatientSearchParameters();

  const { data, isLoading } = usePatientLabTestResults(patient.id, {
    ...searchParameters,
  });

  const dirty = Object.keys(searchParameters).length > 0;
  const isInitialLoad = isLoading && !dirty;
  const noResults = !isLoading && !dirty && data?.count === 0;

  const canViewLabRequestResults = ability?.can('read', 'LabTestResult');

  return (
    <>
      <ResultsSearchBar
        disabled={noResults || isInitialLoad || !canViewLabRequestResults}
        searchParameters={searchParameters}
        setSearchParameters={setSearchParameters}
        patientId={patient?.id}
      />
      <ContentPane>
        {noResults && <NoResultsMessage />}
        {!canViewLabRequestResults && <WrongPermissionMessage />}
        {isInitialLoad && <LoadingIndicator height={400} />}
        {dirty && (
          <PatientLabTestsTable
            patient={patient}
            searchParameters={searchParameters}
            labTests={data?.data}
            count={data?.count}
            isLoading={isLoading}
          />
        )}
      </ContentPane>
    </>
  );
});
