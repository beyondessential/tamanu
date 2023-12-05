import React, { useState } from 'react';
import {
  TopBar,
  PageContainer,
  PatientSearchBar,
  ContentPane,
  SearchTableTitle,
  SearchTable,
} from '../../components';
import { displayId, firstName, lastName, culturalName, village, sex, dateOfBirth } from './columns';
import { PatientImmunisationsModal } from './components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const COLUMNS = [displayId, firstName, lastName, culturalName, village, sex, dateOfBirth];

export const ImmunisationsView = () => {
  const [searchParameters, setSearchParameters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [patient, setPatient] = useState({});
  const onRowClick = row => {
    setPatient(row);
    setModalOpen(true);
  };

  return (
    <PageContainer>
      <PatientImmunisationsModal
        maxWidth="lg"
        fullWidth={false}
        open={modalOpen}
        patient={patient}
        onClose={() => setModalOpen(false)}
      />
      <TopBar
        title={
          <TranslatedText stringId="immunisation.register.title" fallback="Immunisation register" />
        }
      />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText
            stringId="immunisation.register.search.title"
            fallback="Patient immunisation search"
          />
        </SearchTableTitle>
        <PatientSearchBar onSearch={setSearchParameters} suggestByFacility={false} />
        <SearchTable
          endpoint="patient"
          columns={COLUMNS}
          noDataMessage="No patients found"
          onRowClick={onRowClick}
          fetchOptions={searchParameters}
        />
      </ContentPane>
    </PageContainer>
  );
};
