import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueries } from '@tanstack/react-query';
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';
import {
  Button,
  BodyText,
  FormSeparatorLine,
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

const combineQueries = queries => {
  return {
    isLoading: queries.some(q => q.isLoading),
    isFetching: queries.some(q => q.isFetching),
    isSuccess: queries.every(q => q.isSuccess),
    error: queries.find(q => q.error)?.error ?? null,
    data: queries.reduce(
      (accumulator, query) => (query.data ? [...accumulator, query.data] : accumulator),
      [],
    ),
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
  // eslint-disable-next-line no-unused-vars
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, error, data: labRequests } = useLabRequests(labRequestIds);
  const { selectedRows, selectableColumn } = useSelectableColumn(labRequests, {
    columnKey: 'selected',
  });
  // eslint-disable-next-line no-unused-vars
  const handlePrintConfirm = () => {
    // eslint-disable-next-line no-console
    console.log('selected', selectedRows);
    setIsOpen(true);
  };

  if (isLoading) {
    return 'loading...';
  }

  // All the lab requests were made in a batch and have the same details
  const { sampleTime, requestedDate, requestedBy, department, priority, site } = labRequests[0];

  return (
    <Container>
      <BodyText fontWeight={500}>Your lab request has been finalised</BodyText>
      <Card mb={4}>
        <Column>
          <CardItem label="Requesting clinician" value={requestedBy?.displayName} />
          <CardItem label="Department" value={department?.name} />
          <CardItem label="Sample taken" value={<DateDisplay date={sampleTime} showTime />} />
        </Column>
        <BorderColumn>
          <CardItem
            label="Request date & time"
            value={<DateDisplay date={requestedDate} showTime />}
          />
          <CardItem label="Priority" value={priority?.name} />
          <CardItem label="Site" value={site?.name} />
        </BorderColumn>
      </Card>
      <BodyText fontWeight={500}>Your lab request has been finalised</BodyText>
      <CardTable
        headerColor={Colors.white}
        columns={[selectableColumn, ...COLUMNS]}
        data={labRequests}
        elevated={false}
        errorMessage={error?.message}
        noDataMessage="No lab requests found"
        allowExport={false}
      />
      <Actions>
        {/* Todo: add print label action in WAITM-659 */}
        {/* <OutlinedButton size="small">Print label</OutlinedButton> */}
        {/* Todo: add print action */}
        {/* <OutlinedButton size="small" onClick={handlePrintConfirm}> */}
        {/*  Print request */}
        {/* </OutlinedButton> */}
        {/* <MultipleLabRequestsPrintoutModal */}
        {/*  encounter={encounter} */}
        {/*  labRequests={labRequests} */}
        {/*  open={isOpen} */}
        {/*  onClose={() => setIsOpen(false)} */}
        {/* /> */}
      </Actions>
      <FormSeparatorLine />
      <Box display="flex" justifyContent="flex-end" pt={3}>
        <Button onClick={onClose}>Close</Button>
      </Box>
    </Container>
  );
});
