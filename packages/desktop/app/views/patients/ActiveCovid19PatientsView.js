import React, { useEffect, useState } from 'react';
import { groupBy } from 'lodash';
import moment from 'moment';
import styled from 'styled-components';
import People from '@material-ui/icons/People';
import Paper from '@material-ui/core/Paper';

import { useApi } from '../../api';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { TopBar, PageContainer, DataFetchingTable } from '../../components';
import { DateDisplay } from '../../components/DateDisplay';
import { CLINICAL_STATUSES, CLINICAL_COLORS_BY_STATUS, Colors } from '../../constants';

const getClinicalStatusCellColor = ({ clinicalStatus }) =>
  CLINICAL_COLORS_BY_STATUS[clinicalStatus];

const COLUMNS = [
  {
    key: 'clinicalStatus',
    title: 'Clinical Status',
    cellColor: getClinicalStatusCellColor,
    accessor: row => <PriorityDisplay clinicalStatus={row.clinicalStatus} />,
  },
  { key: 'displayId' },
  { key: 'firstName', title: 'First name' },
  { key: 'lastName', title: 'Last name' },
  { key: 'locationName', title: 'Location' },
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
    key: 'lastSurveyDate',
    title: 'Last survey',
    accessor: row => (row.lastSurveyDate ? moment(row.lastSurveyDate).format('DD-MM-YYYY') : ''),
  },
];

const PriorityText = styled.span`
  color: white;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: center;
`;

const PatientText = styled.span`
  color: ${props => props.color};
  font-size: 42px;
`;

const Container = styled.div`
  width: 250px;
  background: ${Colors.white};
`;

const BottomContainer = styled.div`
  border: 1px solid ${Colors.outline};
  border-top: none;
`;

const Header = styled.div`
  color: ${Colors.white};
  background: ${props => props.background};
  justify-content: center;
  display: flex;
  padding: 10px;
`;

const Content = styled.div`
  display: flex;
  justify-content: center;
  padding: 15px 15px 0 15px;
`;

const Title = styled.div`
  align-self: flex-end;
  padding-bottom: 2px;
`;

const PeopleIcon = styled(People)`
  opacity: 0.5;
  padding-right: 5px;
`;

const StatisticsRow = styled(Paper)`
  display: flex;
  margin: 16px 16px 0 16px;
  width: fit-content;

  > div {
    &:first-child {
      div:first-of-type {
        border-top-left-radius: 3px;
      }
      div:last-of-type {
        border-bottom-left-radius: 3px;
      }
    }

    &:last-child {
      div:first-of-type {
        border-top-right-radius: 3px;
      }
      div:last-of-type {
        border-bottom-right-radius: 3px;
      }
    }

    &:last-child {
      border-radius: 0 3px 3px 0;
    }

    &:not(:last-of-type) {
      div:last-child {
        border-right: none;
      }
    }
  }
`;

const ENDPOINT = 'patient/program/activeCovid19Patients';

export const PatientsSummaryCard = ({ clinicalStatus, title, numberOfPatients = 0 }) => {
  const colorTheme = CLINICAL_COLORS_BY_STATUS[clinicalStatus];

  return (
    <Container>
      <Header background={colorTheme}>
        <PeopleIcon />
        <Title>{title}</Title>
      </Header>

      <BottomContainer>
        <Content>
          <PatientText color={colorTheme}>{numberOfPatients}</PatientText>
        </Content>
      </BottomContainer>
    </Container>
  );
};

const PriorityDisplay = React.memo(({ clinicalStatus }) => (
  <PriorityText>{clinicalStatus}</PriorityText>
));

const ActiveCovid19PatientsTable = React.memo(({ data, ...props }) => {
  return (
    <DataFetchingTable
      endpoint={ENDPOINT}
      columns={COLUMNS}
      noDataMessage="No patients found"
      {...props}
    />
  );
});

export const ActiveCovid19PatientsView = React.memo(() => {
  const api = useApi();
  const [data, setData] = useState([]);
  const [patientsByClinicalStatus, setPatientsByClinicalStatus] = useState({});
  useEffect(() => {
    (async () => {
      const activeCovid19PatientsData = await api.get(ENDPOINT);
      setData(activeCovid19PatientsData);
      setPatientsByClinicalStatus(groupBy(activeCovid19PatientsData.data, 'clinicalStatus'));
    })();
  }, []);

  return (
    <PageContainer>
      <TopBar title="Active COVID-19 patients" />
      <StatisticsRow>
        <PatientsSummaryCard
          title={CLINICAL_STATUSES.CRITICAL}
          clinicalStatus={CLINICAL_STATUSES.CRITICAL}
          numberOfPatients={patientsByClinicalStatus[CLINICAL_STATUSES.CRITICAL]?.length || 0}
        />
        <PatientsSummaryCard
          title={CLINICAL_STATUSES.LOW_RISK}
          clinicalStatus={CLINICAL_STATUSES.LOW_RISK}
          numberOfPatients={patientsByClinicalStatus[CLINICAL_STATUSES.LOW_RISK]?.length || 0}
        />
        <PatientsSummaryCard
          title={CLINICAL_STATUSES.NEEDS_REVIEW}
          clinicalStatus={CLINICAL_STATUSES.NEEDS_REVIEW}
          numberOfPatients={patientsByClinicalStatus[CLINICAL_STATUSES.NEEDS_REVIEW]?.length || 0}
        />
      </StatisticsRow>
      <ActiveCovid19PatientsTable data={data} />
    </PageContainer>
  );
});
