import React from 'react';
import styled from 'styled-components';
import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../PatientLabTestsTable';
import { ResultsSearchBar } from '../../../components/ResultsSearchBar';
import { usePatientLabTestResultsQuery } from '../../../api/queries/usePatientLabTestResultsQuery';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { usePatientSearchParameters } from '../../../contexts/PatientViewSearchParameters';
import { useAuth } from '../../../contexts/Auth';

const MessageContainer = styled.div`
  padding: 30px;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
`;

const MessageInner = styled.div`
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

const WrongPermissionInner = styled(MessageInner)`
  color: ${Colors.alert};
`;

const NoResultsMessage = () => (
  <MessageContainer data-testid="messagecontainer-ybo1">
    <MessageInner data-testid="messageinner-mmlt">
      <TranslatedText
        stringId="patient.lab.results.table.noData"
        fallback="This patient has no lab results to display. Once lab results are available they will be displayed here."
        data-testid="translatedtext-rj1j"
      />
    </MessageInner>
  </MessageContainer>
);

const WrongPermissionMessage = () => (
  <MessageContainer data-testid="messagecontainer-u1qz">
    <WrongPermissionInner data-testid="wrongpermissioninner-gdjv">
      <TranslatedText
        stringId="patient.lab.results.table.noPermission"
        fallback="You do not have permission to view lab results"
        data-testid="translatedtext-4jzf"
      />
    </WrongPermissionInner>
  </MessageContainer>
);

export const PatientResultsPane = React.memo(({ patient }) => {
  const { ability } = useAuth();
  const {
    labResultParameters: searchParameters,
    setLabResultParameters: setSearchParameters,
  } = usePatientSearchParameters();

  const { data, isLoading } = usePatientLabTestResultsQuery(patient.id, {
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
        data-testid="resultssearchbar-rh35"
      />
      <ContentPane data-testid="contentpane-o96w">
        {!canViewLabRequestResults ? (
          <WrongPermissionMessage data-testid="wrongpermissionmessage-1s22" />
        ) : (
          <>
            {noResults && <NoResultsMessage data-testid="noresultsmessage-5zha" />}
            {isInitialLoad && <LoadingIndicator height={400} data-testid="loadingindicator-a200" />}
            {dirty && (
              <PatientLabTestsTable
                patient={patient}
                searchParameters={searchParameters}
                labTests={data?.data}
                count={data?.count}
                isLoading={isLoading}
                data-testid="patientlabteststable-9cgh"
              />
            )}
          </>
        )}
      </ContentPane>
    </>
  );
});
