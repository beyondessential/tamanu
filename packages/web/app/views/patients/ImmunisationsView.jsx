import React, { useState } from 'react';
import {
  ContentPane,
  ImmunisationSearchBar,
  PageContainer,
  SearchTable,
  SearchTableTitle,
  TopBar,
} from '../../components';
import { dateOfBirth, displayId, sex, village } from './columns';
import { PatientImmunisationsModal } from './components';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import {
  getDueDate,
  getStatusTag,
  getVaccineName,
  getSchedule,
} from '../../features/ImmunisationsTable/accessors';

const COLUMNS = [
  displayId,
  {
    key: 'fullName',
    title: <TranslatedText stringId="vaccine.table.column.patientName" fallback="Patient name" />,
    accessor: row => `${row.firstName} ${row.lastName}`,
  },
  dateOfBirth,
  sex,
  village,
  {
    key: 'vaccineDisplayName',
    title: <TranslatedText stringId="vaccine.table.column.vaccine" fallback="Vaccine" />,
    accessor: getVaccineName,
  },
  {
    key: 'schedule',
    title: <TranslatedText stringId="vaccine.table.column.schedule" fallback="Schedule" />,
    accessor: getSchedule,
  },
  {
    key: 'dueDate',
    title: <TranslatedText stringId="vaccine.table.column.dueDate" fallback="Due date" />,
    accessor: getDueDate,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="vaccine.table.column.status" fallback="Status" />,
    accessor: getStatusTag,
    sortable: false,
  },
];

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
        <ImmunisationSearchBar onSearch={setSearchParameters} />
        <SearchTable
          endpoint="upcomingVaccinations"
          columns={COLUMNS}
          noDataMessage="No patients found"
          onRowClick={onRowClick}
          fetchOptions={searchParameters}
        />
      </ContentPane>
    </PageContainer>
  );
};
