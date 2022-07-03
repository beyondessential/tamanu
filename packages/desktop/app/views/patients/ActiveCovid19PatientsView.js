import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { groupBy } from 'lodash';
import styled from 'styled-components';
import { useApi } from '../../api';
import { viewPatient } from '../../store/patient';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import {
  TopBar,
  CovidPatientsSearchBar,
  PageContainer,
  DataFetchingTable,
  DateDisplay,
  ContentPane,
} from '../../components';
import { Colors } from '../../constants';
import { StatisticsCard, StatisticsCardContainer } from '../../components/StatisticsCard';

const CLINICAL_STATUSES = {
  CRITICAL: 'Critical',
  NEEDS_REVIEW: 'Needs review',
  LOW_RISK: 'Low risk',
};

const CLINICAL_COLORS_BY_STATUS = {
  [CLINICAL_STATUSES.CRITICAL]: Colors.alert,
  [CLINICAL_STATUSES.NEEDS_REVIEW]: Colors.secondary,
  [CLINICAL_STATUSES.LOW_RISK]: Colors.safe,
};

const getClinicalStatusCellColor = ({ clinicalStatus }) =>
  CLINICAL_COLORS_BY_STATUS[clinicalStatus];

const PriorityText = styled.span`
  color: white;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: center;
`;

const COLUMNS = [
  {
    key: 'clinicalStatus',
    title: 'Clinical status',
    cellColor: getClinicalStatusCellColor,
    accessor: row => <PriorityText>{row.clinicalStatus}</PriorityText>,
  },
  { key: 'displayId' },
  { key: 'firstName', title: 'First name' },
  { key: 'lastName', title: 'Last name' },
  { key: 'villageName', title: 'Village' },
  {
    key: 'sex',
    accessor: row => {
      const sex = row.sex || '';
      return capitaliseFirstLetter(sex);
    },
  },
  { key: 'dateOfBirth', accessor: row => <DateDisplay date={row.dateOfBirth} /> },
  {
    key: 'admissionStartDate',
    title: 'Admission start date',
    accessor: row => <DateDisplay date={row.admissionStartDate} />,
  },
  {
    key: 'lastSurveyDate',
    title: 'Last survey',
    accessor: row => <DateDisplay date={row.lastSurveyDate} />,
  },
];

const ENDPOINT = 'patient/program/activeCovid19Patients';

const ActiveCovid19PatientsTable = React.memo(({ data, ...props }) => {
  const dispatch = useDispatch();
  const handleViewPatient = id => dispatch(viewPatient(id));

  return (
    <DataFetchingTable
      endpoint={ENDPOINT}
      onRowClick={row => handleViewPatient(row.id)}
      columns={COLUMNS}
      noDataMessage="No patients found"
      {...props}
    />
  );
});

const Container = styled(StatisticsCardContainer)`
  margin-bottom: 30px;
  max-width: 1200px;
`;

const Dashboard = React.memo(({ data }) => {
  const patientsByClinicalStatus = groupBy(data, 'clinicalStatus');
  return (
    <Container>
      {Object.entries(CLINICAL_STATUSES).map(([key, clinicalStatus]) => (
        <StatisticsCard
          key={key}
          title={clinicalStatus}
          color={CLINICAL_COLORS_BY_STATUS[clinicalStatus]}
          value={patientsByClinicalStatus[clinicalStatus]?.length || 0}
        />
      ))}
    </Container>
  );
});

export const ActiveCovid19PatientsView = React.memo(() => {
  const api = useApi();
  const [data, setData] = useState([]);
  const [searchParameters, setSearchParameters] = useState({});

  useEffect(() => {
    (async () => {
      const activeCovid19PatientsData = await api.get(ENDPOINT);
      setData(activeCovid19PatientsData);
    })();
  }, [api]);

  return (
    <PageContainer>
      <TopBar title="Active COVID-19 patients" />
      <CovidPatientsSearchBar onSearch={setSearchParameters} />
      <ContentPane>
        <Dashboard data={data} />
        <ActiveCovid19PatientsTable data={data} fetchOptions={searchParameters} />
      </ContentPane>
    </PageContainer>
  );
});
