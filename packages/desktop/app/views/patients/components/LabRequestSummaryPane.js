import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';
import {
  Button,
  BodyText,
  FormSeparatorLine,
  OutlinedButton,
  DateDisplay,
  Table,
  useSelectableColumn,
} from '../../../components';
import { useApi } from '../../../api';

const Container = styled.div`
  padding-top: 20px;
`;

const Card = styled(Box)`
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  padding: 20px 10px;
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
  margin-left: 40px;
`;

const CardTable = styled(Table)`
  //background: white;
  //border-radius: 5px;
  // border: 1px solid ${Colors.outline};
  //padding: 20px 10px;
  //display: flex;
  //align-items: flex-start;
  margin-top: 10px;
  margin-left: 40px;

  table tbody tr:last-child td {
    border: none;
  }
`;

const Column = styled.div`
  flex: 1;
  padding-left: 20px;
`;

const BorderColumn = styled(Column)`
  border-left: 1px solid ${Colors.outline};
`;

const Actions = styled.div`
  display: flex;
  margin: 20px 10px 40px 40px;

  > button {
    margin-right: 15px;
  }
`;

const CardCell = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.tertiary};
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CardLabel = styled.div`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props}>
    <CardLabel>{label}</CardLabel>
    <CardValue>{value}</CardValue>
  </CardCell>
);

const testData = {
  id: '76d09622-b6b3-48cc-b778-303f57a10205',
  sampleTime: '2023-03-01 17:01:01',
  requestedDate: '2023-03-01 17:00:54',
  specimenAttached: false,
  urgent: false,
  status: 'sample-not-collected',
  displayId: 'WZZ5P2F',
  updatedAtSyncTick: '418457',
  createdAt: '2023-03-01T04:01:01.843Z',
  updatedAt: '2023-03-01T04:01:01.843Z',
  encounterId: '0304e900-26bb-47f5-86ae-2e933d8db7b0',
  departmentId: 'ref/department/ANTENATAL',
  requestedById: '6b1269ff-2443-4381-a532-ddd48fbd5020',
  labTestCategoryId: 'labTestCategory-COVID',
  labTestPriorityId: 'LabTestPriority-SecondaryContact',
  tests: [
    {
      id: '32dc6843-25ef-42c9-a019-9e66cd488b69',
      date: '2023-03-01',
      status: 'reception_pending',
      result: '',
      updatedAtSyncTick: '418457',
      createdAt: '2023-03-01T04:01:01.850Z',
      updatedAt: '2023-03-01T04:01:01.850Z',
      labRequestId: '76d09622-b6b3-48cc-b778-303f57a10205',
      labTestTypeId: 'labTestType-COVIDNasalSwab',
      labTestType: {
        id: 'labTestType-COVIDNasalSwab',
        code: 'COVIDNasalSwab',
        name: 'COVID-19 Nasal Swab',
        unit: '',
        maleMin: null,
        maleMax: null,
        femaleMin: null,
        femaleMax: null,
        rangeText: null,
        resultType: 'Number',
        options: 'Positive, Negative, Inconclusive',
        visibilityStatus: 'current',
        updatedAtSyncTick: '0',
        createdAt: '2023-01-12T21:02:25.884Z',
        updatedAt: '2023-01-12T21:02:25.884Z',
        labTestCategoryId: 'labTestCategory-COVID',
      },
    },
    {
      id: '1037626a-5aa3-497b-aebd-09cde35f067c',
      date: '2023-03-01',
      status: 'reception_pending',
      result: '',
      updatedAtSyncTick: '418457',
      createdAt: '2023-03-01T04:01:01.850Z',
      updatedAt: '2023-03-01T04:01:01.850Z',
      labRequestId: '76d09622-b6b3-48cc-b778-303f57a10205',
      labTestTypeId: 'labTestType-Sodium',
      labTestType: {
        id: 'labTestType-Sodium',
        code: 'Sodium',
        name: 'Sodium',
        unit: 'mmol/L',
        maleMin: 135,
        maleMax: 146,
        femaleMin: 135,
        femaleMax: 146,
        rangeText: null,
        resultType: 'Number',
        options: null,
        visibilityStatus: 'current',
        updatedAtSyncTick: '0',
        createdAt: '2023-01-12T21:02:25.884Z',
        updatedAt: '2023-01-12T21:02:25.884Z',
        labTestCategoryId: 'labTestCategory-UE',
      },
    },
  ],
  department: {
    id: 'ref/department/ANTENATAL',
    code: 'ANTENATAL',
    name: 'Antenatal',
    visibilityStatus: 'current',
    updatedAtSyncTick: '0',
    createdAt: '2023-01-12T21:02:25.770Z',
    updatedAt: '2023-01-12T21:02:25.770Z',
    facilityId: 'ref/facility/ba',
  },
  requestedBy: {
    id: '6b1269ff-2443-4381-a532-ddd48fbd5020',
    email: 'admin@tamanu.io',
    displayName: 'Initial Admin',
    role: 'admin',
    updatedAtSyncTick: '418441',
    createdAt: '2023-01-12T21:02:25.686Z',
    updatedAt: '2023-03-01T03:58:42.021Z',
  },
  category: {
    id: 'labTestCategory-COVID',
    code: 'COVID',
    type: 'labTestCategory',
    name: 'COVID-19 Swab',
    visibilityStatus: 'current',
    updatedAtSyncTick: '0',
    createdAt: '2023-01-12T21:02:22.224Z',
    updatedAt: '2023-01-12T21:02:22.224Z',
  },
  priority: {
    id: 'LabTestPriority-SecondaryContact',
    code: 'SecondaryContact',
    type: 'labTestPriority',
    name: 'Secondary contact',
    visibilityStatus: 'current',
    updatedAtSyncTick: '0',
    createdAt: '2023-01-12T21:02:22.224Z',
    updatedAt: '2023-01-12T21:02:22.224Z',
  },
};

const COLUMNS = [
  {
    key: 'displayId',
    title: 'Test ID',
    sortable: false,
  },
  {
    key: 'panelId',
    title: 'Panel',
    sortable: false,
    accessor: ({ panel }) => panel?.name || 'N/A',
  },
  {
    key: 'labTestCategory',
    title: 'Category',
    sortable: false,
    accessor: ({ category }) => category?.name || '',
  },
];

const testIds = [
  'ad86448e-0165-4a24-8db5-235e26ada29d',
  'c702b9db-3e30-4261-bf2a-03fe107c23a0',
  '0e068d1b-9b18-43f6-b6a2-739dc32b63a9',
];

const combineQueries = queries => {
  console.log('input', queries);
  return {
    isLoading: !!queries.find(q => q.isLoading),
    isFetching: !!queries.find(q => q.isFetching),

    // How to do opposite for success
    isSuccess: !!queries.find(q => q.isSuccess),
    error: queries.find(q => q.error)?.error ?? null,
    data: queries.reduce((accumulator, query) => {
      return query.data ? [...accumulator, query.data] : accumulator;
    }, []),
  };
};

const useLabRequests = labRequestIds => {
  const api = useApi();
  const queries = useQueries({
    queries: labRequestIds.map(labRequestId => {
      return {
        queryKey: ['labRequest', labRequestId],
        queryFn: () => api.get(`labRequest/${labRequestId}`),
      };
    }),
  });
  return combineQueries(queries);
};

export const LabRequestSummaryPane = React.memo(({ labRequestIds, onClose }) => {
  const queries = useLabRequests(testIds);
  const { isLoading, error, data } = queries;

  const { selectedRows, selectableColumn } = useSelectableColumn(data, {
    columnKey: 'selected',
  });
  const handlePrintConfirm = () => {
    console.log('selected', selectedRows);
  };

  if (isLoading) {
    return 'loading...';
  }

  const { sampleTime, requestedDate, requestedBy, department, priority, site } = data[0];

  return (
    <Container>
      <BodyText fontWeight={500}>Your lab request has been finalised</BodyText>
      <Card mb={4}>
        <Column>
          <CardItem label="Requesting clinician" value={requestedBy.displayName} />
          <CardItem label="Department" value={department.name} />
          <CardItem label="Sample taken" value={<DateDisplay date={sampleTime} showTime />} />
        </Column>
        <BorderColumn>
          <CardItem
            label="Request date & time"
            value={<DateDisplay date={requestedDate} showTime />}
          />
          <CardItem label="Priority" value={priority.name} />
          <CardItem label="Site" value={site.name} />
        </BorderColumn>
      </Card>
      <BodyText fontWeight={500}>Your lab request has been finalised</BodyText>
      <CardTable
        headerColor={Colors.white}
        columns={[selectableColumn, ...COLUMNS]}
        data={data}
        elevated={false}
        errorMessage={error?.message}
        noDataMessage="No lab requests found"
        allowExport={false}
      />
      <Actions>
        <OutlinedButton size="small">Print label</OutlinedButton>
        <OutlinedButton size="small" onClick={handlePrintConfirm}>
          Print request
        </OutlinedButton>
      </Actions>
      <FormSeparatorLine />
      <Box display="flex" justifyContent="flex-end" pt={3}>
        <Button onClick={onClose}>Close</Button>
      </Box>
    </Container>
  );
});
