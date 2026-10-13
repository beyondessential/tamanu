import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { DIAGNOSIS_CERTAINTY_CONFIG, DIAGNOSIS_CERTAINTY_LABELS } from '@tamanu/constants';
import { Colors } from '../constants/styles';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { LimitedLinesCell } from './FormattedTableCell';
import { TableCellTag } from './Tag';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from './Translation';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  border: none;
  border-radius: 0;
  border-top: 1px solid ${Colors.outline};
  .MuiTableHead-root {
    position: sticky;
    top: 0;
  }
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 12px;
    padding-bottom: 12px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 10px;
    padding-right: 10px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableCell-body {
    padding: 4px 10px;
    height: 44px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onRowClick ? 'pointer' : '')};
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
  .MuiTableBody-root {
    .MuiTableRow-root {
      &:last-child {
        td {
          border-bottom: none;
        }
      }
    }
  }
`;

const NoWrapCell = styled(Box)`
  white-space: nowrap;
`;

const CertaintyTag = styled(TableCellTag)`
  font-size: 14px;
  line-height: 18px;
`;

// A diagnosis's reference data can be missing from the list, such as when it has been deleted or
// has yet to sync, so the row still renders without it.
const getDiagnosisLabel = ({ diagnosis }) =>
  diagnosis ? (
    <TranslatedReferenceData
      fallback={diagnosis.name}
      value={diagnosis.id}
      category="diagnosis"
      data-testid="translatedreferencedata-diagnosis"
    />
  ) : null;

const getType = ({ isPrimary }) =>
  isPrimary ? (
    <TranslatedText
      stringId="encounter.diagnosis.type.primary.short"
      fallback="Primary"
      data-testid="translatedtext-primary"
    />
  ) : (
    <TranslatedText
      stringId="encounter.diagnosis.type.secondary.short"
      fallback="Secondary"
      data-testid="translatedtext-secondary"
    />
  );

const getClinician = ({ clinician }) => (
  <NoWrapCell data-testid="nowrapcell-clinician">{clinician?.displayName}</NoWrapCell>
);

// Certainty is nullable, and only validated by the application, so a row may hold none or a value
// with no colour of its own.
const getCertainty = ({ certainty }) => {
  if (!certainty) return null;
  const color = DIAGNOSIS_CERTAINTY_CONFIG[certainty]?.color ?? Colors.midText;
  return (
    <CertaintyTag $color={color} noWrap data-testid="tablecelltag-certainty">
      <TranslatedEnum
        value={certainty}
        enumValues={DIAGNOSIS_CERTAINTY_LABELS}
        data-testid="translatedenum-certainty"
      />
    </CertaintyTag>
  );
};

const COLUMNS = [
  {
    key: 'Diagnosis.name',
    title: (
      <TranslatedText
        stringId="general.localisedField.diagnosis.label"
        fallback="Diagnosis"
        data-testid="translatedtext-column-diagnosis"
      />
    ),
    accessor: getDiagnosisLabel,
    CellComponent: LimitedLinesCell,
  },
  {
    key: 'isPrimary',
    title: (
      <TranslatedText
        stringId="diagnosis.table.column.type"
        fallback="Type"
        data-testid="translatedtext-column-type"
      />
    ),
    accessor: getType,
  },
  {
    key: 'date',
    title: (
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
        data-testid="translatedtext-column-date"
      />
    ),
    accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-date" />,
  },
  {
    key: 'clinician.displayName',
    title: (
      <TranslatedText
        stringId="general.localisedField.clinician.label"
        fallback="Clinician"
        data-testid="translatedtext-column-clinician"
      />
    ),
    accessor: getClinician,
    CellComponent: LimitedLinesCell,
  },
  {
    key: 'certainty',
    title: (
      <TranslatedText
        stringId="diagnosis.certainty.label"
        fallback="Certainty"
        data-testid="translatedtext-column-certainty"
      />
    ),
    accessor: getCertainty,
  },
];

// Unsorted until a column is chosen, so the server's default order applies: primary diagnoses
// first and disproven ones last.
export const DiagnosisTable = React.memo(({ encounterId, onItemClick, refreshCount }) => (
  <StyledDataFetchingTable
    columns={COLUMNS}
    endpoint={`encounter/${encounterId}/diagnoses`}
    onRowClick={onItemClick}
    elevated={false}
    allowExport={false}
    disablePagination
    refreshCount={refreshCount}
    data-testid="datafetchingtable-diagnoses"
  />
));
