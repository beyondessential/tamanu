import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import { Colors } from '../../../constants';
import { MultipleLabRequestsPrintoutModal } from '../../../components/PatientPrinting/modals/MultipleLabRequestsPrintoutModal';
import {
  BodyText,
  Button,
  DateDisplay,
  FormSeparatorLine,
  Heading3,
  LowerCase,
  OutlinedButton,
  Table,
  useSelectableColumn,
} from '../../../components';
import { LabRequestPrintLabelModal } from '../../../components/PatientPrinting/modals/LabRequestPrintLabelModal';
import { useLabRequestNotes } from '../../../api/queries';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';

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
    title: <TranslatedText stringId="lab.requestSummary.table.column.testId" fallback="Test ID" />,
    sortable: false,
  },
  ...(type === LAB_REQUEST_FORM_TYPES.PANEL
    ? [
      {
        key: 'panelId',
        title: (
          <TranslatedText stringId="lab.requestSummary.table.column.panel" fallback="Panel" />
        ),
        sortable: false,
        accessor: ({ labTestPanelRequest }) =>
          labTestPanelRequest?.labTestPanel?.name && (
            <TranslatedReferenceData
              fallback={labTestPanelRequest.labTestPanel.name}
              value={labTestPanelRequest.labTestPanel.id}
              category="labTestPanel"
            />
          ) || (
            <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />
          ),
      },
    ]
    : []),
  {
    key: 'labTestCategory',
    title: (
      <TranslatedText stringId="lab.requestSummary.table.column.testCategory" fallback="Category" />
    ),
    sortable: false,
    accessor: ({ category }) => category?.name && (
      <TranslatedReferenceData
        fallback={category.name}
        value={category.id}
        category={category.type}
      />
    ) || '',
  },
  {
    key: 'sampleDate',
    title: (
      <TranslatedText
        stringId="lab.requestSummary.table.column.sampleDate"
        fallback="Sample date"
      />
    ),
    sortable: false,
    accessor: ({ sampleTime }) =>
      sampleTime ? (
        <DateDisplay showTime date={sampleTime} />
      ) : (
        <TranslatedText
          stringId="lab.requestSummary.table.column.sampleDate.notCollected"
          fallback="Sample not collected"
        />
      ),
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
    const noRowSelected = useMemo(() => !selectedRows?.length, [selectedRows]);
    // All the lab requests were made in a batch and have the same details
    const { id, requestedDate, requestedBy, department, priority } = labRequests[0];

    const { data: { data: notes = [] } = {}, isLoading: areNotesLoading } = useLabRequestNotes(id);

    return (
      <Container>
        <Heading3 mb="12px">
          <TranslatedText stringId="lab.requestSummary.heading" fallback="Request finalised" />
        </Heading3>
        <BodyText mb="28px" color="textTertiary">
          <TranslatedText
            stringId="lab.requestSummary.instruction"
            fallback="Your lab request has been finalised. Please select items from the list below to print
          requests or sample labels."
          />
        </BodyText>
        <Card>
          <StyledInfoCard gridRowGap={10} elevated={false}>
            <InfoCardItem
              label={
                <TranslatedText
                  stringId="general.requestingClinician.label"
                  fallback="Requesting :clinician"
                  replacements={{
                    clinician: (
                      <LowerCase>
                        <TranslatedText
                          stringId="general.localisedField.clinician.label.short"
                          fallback="Clinician"
                        />
                      </LowerCase>
                    ),
                  }}
                />
              }
              value={requestedBy?.displayName}
            />
            <InfoCardItem
              label={
                <TranslatedText
                  stringId="general.requestDateTime.label"
                  fallback="Request date & time"
                />
              }
              value={<DateDisplay date={requestedDate} showTime />}
            />
            <InfoCardItem
              label={
                <TranslatedText stringId="general.department.label" fallback="Department" />
              }
              value={department?.name && (
                <TranslatedReferenceData
                  fallback={department.name}
                  value={department.id}
                  category="department"
                />)
              }
            />
            <InfoCardItem
              label={<TranslatedText stringId="lab.priority.label" fallback="Priority" />}
              value={priority
                ? <TranslatedReferenceData
                  fallback={priority.name}
                  value={priority.id}
                  category={priority.type}
                />
                : '-'}
            />
          </StyledInfoCard>
          <CardTable
            headerColor={Colors.white}
            columns={[selectableColumn, ...getColumns(requestFormType)]}
            data={labRequests}
            elevated={false}
            noDataMessage={<TranslatedText stringId="lab.requestSummary.table.noData" />}
            allowExport={false}
          />
        </Card>
        <Actions>
          <OutlinedButton
            size="small"
            onClick={() => setIsOpen(MODALS.LABEL_PRINT)}
            disabled={noRowSelected}
          >
            <TranslatedText stringId="lab.action.printLabel" fallback="Print label" />
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
            <TranslatedText stringId="lab.action.printRequest" fallback="Print request" />
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
          <Button onClick={onClose}>
            <TranslatedText stringId="general.action.close" fallback="Close" />
          </Button>
        </Box>
      </Container>
    );
  },
);
