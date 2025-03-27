import React, { useState } from 'react';
import styled from 'styled-components';
import { Redirect, useParams } from 'react-router-dom';
import { Colors } from '../../constants';
import { useListOfProgramRegistryQuery } from '../../api/queries/useProgramRegistryQuery';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { ProgramRegistrySearchBar } from './ProgramRegistrySearchBar';
import { ProgramRegistryTable } from './ProgramRegistryTable';
import { TranslatedReferenceData, TranslatedText } from '../../components';

const ViewHeader = styled.div`
  background-color: ${Colors.white};
  border-bottom: 1px solid ${Colors.softOutline};
  padding: 20px 30px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  h1 {
    margin: 0px;
    font-weight: 500;
    font-size: 24px;
  }
`;

const Container = styled.div`
  padding: 30px;
`;

export const ProgramRegistryView = () => {
  const { programRegistryId } = useParams();
  const searchParams = useUrlSearchParams();
  const [searchParameters, setSearchParameters] = useState({});
  const { data: programRegistries, isLoading, isSuccess } = useListOfProgramRegistryQuery();

  if (isLoading) return <LoadingIndicator />;
  if (
    isSuccess &&
    programRegistries?.data &&
    programRegistries.data.length > 0 &&
    programRegistries.data.find(x => x.id === programRegistryId)
  )
    return (
      <>
        <ViewHeader>
          <h1>
            <TranslatedReferenceData
              fallback={searchParams.get('name')}
              value={programRegistryId}
              category="programRegistry"
            />
          </h1>
        </ViewHeader>
        <Container>
          <span>
            <TranslatedText
              stringId="programRegistry.patientSearch.title"
              fallback="Program patient search"
            />
          </span>
          <ProgramRegistrySearchBar
            searchParameters={searchParameters}
            setSearchParameters={setSearchParameters}
          />
          <ProgramRegistryTable searchParameters={searchParameters} />
        </Container>
      </>
    );
  return <Redirect to="/patients/all" />;
};
