import React, { useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { Colors } from '../../../constants';
import { MultipleLabRequestsPrintoutModal } from '../../../components/PatientPrinting/modals/MultipleLabRequestsPrintoutModal';
import {
  Button,
  BodyText,
  FormSeparatorLine,
  DateDisplay,
  Table,
  useSelectableColumn,
  OutlinedButton,
} from '../../../components';
import { LabRequestPrintLabelModal } from '../../../components/PatientPrinting/modals/LabRequestPrintLabelModal';
import { useLabRequestNotes } from '../../../api/queries';

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

const getColumns = type => [
  {
    key: 'displayId',
    title: 'Test ID',
    sortable: false,
  },
  ...(type === LAB_REQUEST_FORM_TYPES.PANEL
    ? [
        {
          key: 'panelId',
          title: 'Panel',
          sortable: false,
          accessor: ({ labTestPanelRequest }) => labTestPanelRequest?.labTestPanel?.name || 'N/A',
        },
      ]
    : []),
  {
    key: 'labTestCategory',
    title: 'Category',
    sortable: false,
    accessor: ({ category }) => category?.name || '',
  },
];

const MODALS = {
  PRINT: 'print',
  LABEL_PRINT: 'labelPrint',
};

export const LabRequestSummaryPane = React.memo(
  ({ encounter, labRequests, requestFormType, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { selectedRows, selectableColumn } = useSelectableColumn(labRequests, {
      columnKey: 'selected',
    });

    // All the lab requests were made in a batch and have the same details
    const {
      id,
      sampleTime,
      requestedDate,
      requestedBy,
      department,
      priority,
      site,
    } = labRequests[0];

    const { data: notePages, isLoading: areNotesLoading } = useLabRequestNotes(id);

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
          columns={[selectableColumn, ...getColumns(requestFormType)]}
          data={labRequests}
          elevated={false}
          noDataMessage="No lab requests found"
          allowExport={false}
        />
        <Actions>
          <OutlinedButton size="small" onClick={() => setIsOpen(MODALS.LABEL_PRINT)}>
            Print label
          </OutlinedButton>
          <LabRequestPrintLabelModal
            labRequests={selectedRows}
            open={isOpen === MODALS.LABEL_PRINT}
            onClose={() => setIsOpen(false)}
          />
          <OutlinedButton
            disabled={areNotesLoading}
            size="small"
            onClick={() => setIsOpen(MODALS.PRINT)}
          >
            Print request
          </OutlinedButton>
          <MultipleLabRequestsPrintoutModal
            encounter={encounter}
            labRequests={selectedRows.map(row => ({
              ...row,
              notePages,
            }))}
            open={isOpen === MODALS.PRINT}
            onClose={() => setIsOpen(false)}
          />
        </Actions>
        <FormSeparatorLine />
        <Box display="flex" justifyContent="flex-end" pt={3}>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Container>
    );
  },
);
