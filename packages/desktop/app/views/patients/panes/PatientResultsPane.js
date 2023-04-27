import React, { useState } from 'react';
import styled from 'styled-components';

import { ContentPane } from '../../../components';
import { PatientLabTestsTable } from '../PatientLabTestsTable';
import { ResultsSearchBar } from '../../../components/ResultsSearchBar';
import { usePatientLabTestResults } from '../../../api/queries/usePatientLabTestResults';
import { Colors } from '../../../constants';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

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

const NoResultsMessage = () => (
  <NoResultContainer>
    <NoResultsInner>
      This patient has no lab results to display. Once lab results are available they will be
      displayed here.
    </NoResultsInner>
  </NoResultContainer>
);

export const PatientResultsPane = React.memo(({ patient }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [searchParameters, setSearchParameters] = useState({ panelId: '', categoryId: '' });

  const { data, isLoading } = usePatientLabTestResults(patient.id, {
    page,
    rowsPerPage,
    ...searchParameters,
  });

  const hasSearchParams = searchParameters.categoryId || searchParameters.panelId;
  const disabled = !hasSearchParams && !isLoading && data?.count === 0;

  return (
    <>
      <ResultsSearchBar
        disabled={disabled}
        searchParameters={searchParameters}
        setSearchParameters={setSearchParameters}
        patientId={patient?.id}
      />
      <ContentPane>
        {disabled && <NoResultsMessage />}
        {hasSearchParams && (
          <PatientLabTestsTable
            patient={patient}
            searchParameters={searchParameters}
            labTests={data?.data}
            count={data?.count}
            isLoading={isLoading}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            page={page}
            setPage={setPage}
          />
        )}
      </ContentPane>
    </>
  );
});
