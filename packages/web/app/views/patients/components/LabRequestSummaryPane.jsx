import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Button, OutlinedButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { MultipleLabRequestsPrintoutModal } from '../../../components/PatientPrinting/modals/MultipleLabRequestsPrintoutModal';
import {
  BodyText,
  DateDisplay,
  FormSeparatorLine,
  Table,
  useSelectableColumn,
} from '../../../components';
import { LabRequestFinalisedHeader } from '../../../components/PatientPrinting/LabRequestFinalisedHeader';
import { LabRequestPrintLabelModal } from '../../../components/PatientPrinting/modals/LabRequestPrintLabelModal';
import { useSettings } from '../../../contexts/Settings';
import { useLabRequestNotesQuery } from '../../../api/queries';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';
import { getLabRequestTestAndPanelNames } from '../../../utils/lab';

const Container = styled.div`
  padding-top: 20px;
`;

const CardTable = styled(Table)`
  border: none;

  table {
    tbody tr:last-child td {
      border: none;
    }
    thead tr th {
      color: ${props => props.theme.palette.text.tertiary};
    }

    tr th:first-child,
    tr td:first-child {
      padding-left: 0;
    }
  }
`;

const Card = styled.div`
  background: ${Colors.white};
  border-radius: 5px;
  padding: 0 12px;
  border: 1px solid ${Colors.outline};
`;

const Actions = styled.div`
  display: flex;
  margin: 22px 0;
  > button {
    margin-right: 15px;
  }
`;

const getColumns = () => [
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
    key: 'testsAndPanels',
    title: (
      <TranslatedText
        stringId="lab.requestSummary.table.column.test"
        fallback="Test"
        data-testid="translatedtext-test-column"
      />
    ),
    sortable: false,
    accessor: row => getLabRequestTestAndPanelNames(row).join(', '),
  },
  {
    key: 'sampleDate',
    title: (
      <TranslatedText
        stringId="lab.requestSummary.table.column.dateTimeCollected"
        fallback="Date & time collected"
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
  AUTO_LABEL_PRINT: 'autoLabelPrint',
};

export const LabRequestSummaryPane = React.memo(({ encounter, labRequests, onClose }) => {
  const { getSetting } = useSettings();
  // Auto-print the sample labels when every sample in the request has been recorded and the
  // facility has opted in; the print screen then replaces the standard finalise screen.
  const autoPrintLabel =
    Boolean(getSetting('labs.autoPrintSampleLabel')) &&
    labRequests.every(request => Boolean(request.sampleTime));
  const [isOpen, setIsOpen] = useState(false);
  // Present the sample-label print screen the first time the setting and recorded samples allow it,
  // even if the setting or lab requests resolve after the first render. Adjusting state during render
  // (rather than in an Effect) opens it before paint, so the standard finalise screen never flashes.
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
  if (autoPrintLabel && !hasAutoPrinted) {
    setHasAutoPrinted(true);
    setIsOpen(MODALS.AUTO_LABEL_PRINT);
  }
  // The auto-print screen prints every request and closing it ends the finalise flow; the manual
  // "Print labels" button prints the table's selection and returns to the summary.
  const isAutoLabelPrint = isOpen === MODALS.AUTO_LABEL_PRINT;
  const { selectedRows, selectableColumn } = useSelectableColumn(labRequests, {
    columnKey: 'selected',
    showIndeterminate: true,
    // Categories whose sample is already recorded start selected; the rest are left for the user.
    getIsRowInitiallySelected: request => Boolean(request.sampleTime),
    // A sample that has not been recorded cannot be printed, so its row is not selectable —
    // for the per-row checkbox and for the select-all control.
    getIsRowDisabled: (selectedKeys, row) => !row.sampleTime,
    getRowsFilterer: () => request => Boolean(request.sampleTime),
  });
  const noRowSelected = useMemo(() => !selectedRows?.length, [selectedRows]);
  // All the lab requests were made in a batch and have the same details
  const { id } = labRequests[0];

  const { data: { data: notes = [] } = {}, isLoading: areNotesLoading } =
    useLabRequestNotesQuery(id);

  return (
    <Container data-testid="container-nnz7">
      <LabRequestFinalisedHeader />
      <FormSeparatorLine />
      <BodyText mt="20px" mb="28px">
        <TranslatedText
          stringId="lab.requestSummary.instruction"
          fallback="Please select items from the list below to print sample labels or the lab request."
        />
      </BodyText>
      <Card data-testid="card-ixan">
        <CardTable
          headerColor={Colors.white}
          columns={[selectableColumn, ...getColumns()]}
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
            stringId="lab.requestSummary.action.printLabels"
            fallback="Print labels"
            data-testid="translatedtext-z6vw"
          />
        </OutlinedButton>
        <LabRequestPrintLabelModal
          labRequests={isAutoLabelPrint ? labRequests : selectedRows}
          open={isOpen === MODALS.LABEL_PRINT || isAutoLabelPrint}
          onClose={isAutoLabelPrint ? onClose : () => setIsOpen(false)}
          showFinalisedHeader
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
          labRequests={selectedRows.map(row => ({
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
});
