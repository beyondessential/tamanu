import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import { Button, OutlinedButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { MultipleLabRequestsPrintoutModal } from '../../../components/PatientPrinting/modals/MultipleLabRequestsPrintoutModal';
import {
  BodyText,
  DateDisplay,
  FormSeparatorLine,
  Heading3,
  Table,
  useSelectableColumn,
} from '../../../components';
import { LabRequestPrintLabelModal } from '../../../components/PatientPrinting/modals/LabRequestPrintLabelModal';
import { useLabRequestNotesQuery } from '../../../api/queries';
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
      color: ${(props) => props.theme.palette.text.tertiary};
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

const getColumns = (type) => [
  {
    key: 'displayId',
    title: (
      <TranslatedText
        stringId="lab.requestSummary.table.column.testId"
        fallback="Test ID"
        data-testid="translatedtext-i1sg"
      />
    ),
    sortable: false,
  },
  ...(type === LAB_REQUEST_FORM_TYPES.PANEL
    ? [
        {
          key: 'panelId',
          title: (
            <TranslatedText
              stringId="lab.requestSummary.table.column.panel"
              fallback="Panel"
              data-testid="translatedtext-me7m"
            />
          ),
          sortable: false,
          accessor: ({ labTestPanelRequest }) =>
            (labTestPanelRequest?.labTestPanel?.name && (
              <TranslatedReferenceData
                fallback={labTestPanelRequest.labTestPanel.name}
                value={labTestPanelRequest.labTestPanel.id}
                category="labTestPanel"
                data-testid="translatedreferencedata-6okl"
              />
            )) || (
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                data-testid="translatedtext-zjj6"
              />
            ),
        },
      ]
    : []),
  {
    key: 'labTestCategory',
    title: (
      <TranslatedText
        stringId="lab.requestSummary.table.column.testCategory"
        fallback="Category"
        data-testid="translatedtext-1d59"
      />
    ),
    sortable: false,
    accessor: ({ category }) =>
      (category?.name && (
        <TranslatedReferenceData
          fallback={category.name}
          value={category.id}
          category={category.type}
          data-testid="translatedreferencedata-p9k2"
        />
      )) ||
      '',
  },
  {
    key: 'sampleDate',
    title: (
      <TranslatedText
        stringId="lab.requestSummary.table.column.sampleDate"
        fallback="Sample date"
        data-testid="translatedtext-m30l"
      />
    ),
    sortable: false,
    accessor: ({ sampleTime }) =>
      sampleTime ? (
        <DateDisplay timeFormat="default" date={sampleTime} data-testid="datedisplay-6me3" />
      ) : (
        <TranslatedText
          stringId="lab.requestSummary.table.column.sampleDate.notCollected"
          fallback="Sample not collected"
          data-testid="translatedtext-h4qx"
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

    const { data: { data: notes = [] } = {}, isLoading: areNotesLoading } =
      useLabRequestNotesQuery(id);

    return (
      <Container data-testid="container-nnz7">
        <Heading3 mb="12px" data-testid="heading3-en7t">
          <TranslatedText
            stringId="lab.requestSummary.heading"
            fallback="Request finalised"
            data-testid="translatedtext-puds"
          />
        </Heading3>
        <BodyText mb="28px" color="textTertiary" data-testid="bodytext-1b6q">
          <TranslatedText
            stringId="lab.requestSummary.instruction"
            fallback="Your lab request has been finalised. Please select items from the list below to print
          requests or sample labels."
            data-testid="translatedtext-9d2v"
          />
        </BodyText>
        <Card data-testid="card-ixan">
          <StyledInfoCard gridRowGap={10} elevated={false} data-testid="styledinfocard-bbt5">
            <InfoCardItem
              label={
                <TranslatedText
                  stringId="general.requestingClinician.label"
                  fallback="Requesting :clinician"
                  replacements={{
                    clinician: (
                      <TranslatedText
                        stringId="general.localisedField.clinician.label.short"
                        fallback="Clinician"
                        casing="lower"
                        data-testid="translatedtext-ncbb"
                      />
                    ),
                  }}
                  data-testid="translatedtext-0m7u"
                />
              }
              value={requestedBy?.displayName}
              data-testid="infocarditem-l0dj"
            />
            <InfoCardItem
              label={
                <TranslatedText
                  stringId="general.requestDateTime.label"
                  fallback="Request date & time"
                  data-testid="translatedtext-1wh9"
                />
              }
              value={<DateDisplay date={requestedDate} timeFormat="default" data-testid="datedisplay-uuu4" />}
              data-testid="infocarditem-1bt0"
            />
            <InfoCardItem
              label={
                <TranslatedText
                  stringId="general.department.label"
                  fallback="Department"
                  data-testid="translatedtext-ggy0"
                />
              }
              value={
                department?.name && (
                  <TranslatedReferenceData
                    fallback={department.name}
                    value={department.id}
                    category="department"
                    data-testid="translatedreferencedata-pwxd"
                  />
                )
              }
              data-testid="infocarditem-3f51"
            />
            <InfoCardItem
              label={
                <TranslatedText
                  stringId="lab.priority.label"
                  fallback="Priority"
                  data-testid="translatedtext-6qta"
                />
              }
              value={
                priority ? (
                  <TranslatedReferenceData
                    fallback={priority.name}
                    value={priority.id}
                    category={priority.type}
                    data-testid="translatedreferencedata-dd16"
                  />
                ) : (
                  '-'
                )
              }
              data-testid="infocarditem-d4fk"
            />
          </StyledInfoCard>
          <CardTable
            headerColor={Colors.white}
            columns={[selectableColumn, ...getColumns(requestFormType)]}
            data={labRequests}
            elevated={false}
            noDataMessage={
              <TranslatedText
                stringId="lab.requestSummary.table.noData"
                data-testid="translatedtext-bl2j"
              />
            }
            allowExport={false}
            data-testid="cardtable-kbqx"
          />
        </Card>
        <Actions data-testid="actions-3chb">
          <OutlinedButton
            size="small"
            onClick={() => setIsOpen(MODALS.LABEL_PRINT)}
            disabled={noRowSelected}
            data-testid="outlinedbutton-skm0"
          >
            <TranslatedText
              stringId="lab.action.printLabel"
              fallback="Print label"
              data-testid="translatedtext-z6vw"
            />
          </OutlinedButton>
          <LabRequestPrintLabelModal
            labRequests={selectedRows}
            open={isOpen === MODALS.LABEL_PRINT}
            onClose={() => setIsOpen(false)}
            data-testid="labrequestprintlabelmodal-n8hs"
          />
          <OutlinedButton
            disabled={areNotesLoading || noRowSelected}
            size="small"
            onClick={() => setIsOpen(MODALS.PRINT)}
            data-testid="outlinedbutton-01eu"
          >
            <TranslatedText
              stringId="lab.action.printRequest"
              fallback="Print request"
              data-testid="translatedtext-l2yx"
            />
          </OutlinedButton>
          <MultipleLabRequestsPrintoutModal
            encounter={encounter}
            labRequests={selectedRows.map((row) => ({
              ...row,
              notes,
            }))}
            open={isOpen === MODALS.PRINT}
            onClose={() => setIsOpen(false)}
            data-testid="multiplelabrequestsprintoutmodal-1dc5"
          />
        </Actions>
        <FormSeparatorLine data-testid="formseparatorline-9zz8" />
        <Box display="flex" justifyContent="flex-end" pt={3} data-testid="box-t4gx">
          <Button onClick={onClose} data-testid="button-9vga">
            <TranslatedText
              stringId="general.action.close"
              fallback="Close"
              data-testid="translatedtext-wus3"
            />
          </Button>
        </Box>
      </Container>
    );
  },
);
