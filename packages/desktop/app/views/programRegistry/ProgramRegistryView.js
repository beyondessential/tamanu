import React, { useState } from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { ProgramRegistrySearchBar } from './ProgramRegistrySearchBar';
import { ProgramRegistryTable } from './ProgramRegistryTable';

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
  const searchParams = useUrlSearchParams();
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <>
      <ViewHeader>
        <h1>{searchParams.get('name')}</h1>
      </ViewHeader>
      <Container>
        <span>Program patient search</span>
        <ProgramRegistrySearchBar
          searchParameters={searchParameters}
          setSearchParameters={setSearchParameters}
        />
        <ProgramRegistryTable searchParameters={searchParams} />
      </Container>
    </>
  );
};
