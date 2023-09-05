import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
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
  Heading3,
  useLocalisedText,
} from '../../../components';
import { LabRequestPrintLabelModal } from '../../../components/PatientPrinting/modals/LabRequestPrintLabelModal';
import { useLabRequestNotes } from '../../../api/queries';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';

const Container = styled.div`
  padding-top: 20px;
`;

const StyledInfoCard = styled(InfoCard)`
  border-radius: 0;
  padding: 20px;
  & div > span {
    font-size: 14px;
  }
`;

const CardTable = styled(Table)`
  border: none;
  margin-top: 10px;
  table {
    tbody tr:last-child td {
      border: none;
    }
    thead tr th {
      color: ${props => props.theme.palette.text.tertiary};
    }
  }
`;

const Card = styled.div`
  background: ${Colors.white};
  border-radius: 5px;
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
`;

const Actions = styled.div`
  display: flex;
  margin: 22px 0;
  > button {
    margin-right: 15px;
  }
`;

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
          accessor: ({ labPanelRequest }) => labPanelRequest?.labPanel?.name || 'N/A',
        },
      ]
    : []),
  {
    key: 'labTestCategory',
    title: 'Category',
    sortable: false,
    accessor: ({ category }) => category?.name || '',
  },
  {
    key: 'sampleDate',
    title: 'Sample date',
    sortable: false,
    accessor: ({ sampleTime }) =>
      sampleTime ? <DateDisplay showTime date={sampleTime} /> : 'Sample not collected',
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
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
    const noRowSelected = useMemo(() => !selectedRows?.length, [selectedRows]);
    // All the lab requests were made in a batch and have the same details
    const { id, requestedDate, requestedBy, department, priority } = labRequests[0];

    const { data: { data: notes = [] } = {}, isLoading: areNotesLoading } = useLabRequestNotes(id);

    return (
      <Container>
        <Heading3 mb="12px">Request finalised</Heading3>
        <BodyText mb="28px" color="textTertiary">
          Your lab request has been finalised. Please select items from the list below to print
          requests or sample labels.
        </BodyText>
        <Card>
          <StyledInfoCard gridRowGap={10} elevated={false}>
            <InfoCardItem
              label={`Requesting ${clinicianText.toLowerCase()}`}
              value={requestedBy?.displayName}
            />
            <InfoCardItem
              label="Request date & time"
              value={<DateDisplay date={requestedDate} showTime />}
            />
            <InfoCardItem label="Department" value={department?.name} />
            <InfoCardItem label="Priority" value={priority ? priority.name : '-'} />
          </StyledInfoCard>
          <CardTable
            headerColor={Colors.white}
            columns={[selectableColumn, ...getColumns(requestFormType)]}
            data={labRequests}
            elevated={false}
            noDataMessage="No lab requests found"
            allowExport={false}
          />
        </Card>
        <Actions>
          <OutlinedButton
            size="small"
            onClick={() => setIsOpen(MODALS.LABEL_PRINT)}
            disabled={noRowSelected}
          >
            Print label
          </OutlinedButton>
          <LabRequestPrintLabelModal
            labRequests={selectedRows}
            open={isOpen === MODALS.LABEL_PRINT}
            onClose={() => setIsOpen(false)}
          />
          <OutlinedButton
            disabled={areNotesLoading || noRowSelected}
            size="small"
            onClick={() => setIsOpen(MODALS.PRINT)}
          >
            Print request
          </OutlinedButton>
          <MultipleLabRequestsPrintoutModal
            encounter={encounter}
            labRequests={selectedRows.map(row => ({
              ...row,
              notes,
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
