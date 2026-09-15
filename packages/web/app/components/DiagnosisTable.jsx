import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { DIAGNOSIS_CERTAINTY_LABELS } from '@tamanu/constants';
import { Colors } from '../constants/styles';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { LimitedLinesCell } from './FormattedTableCell';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from './Translation';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  border: none;
  border-radius: 0;
  border-top: 1px solid ${Colors.outline};
  margin-top: 8px;
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

const getDiagnosisLabel = ({ diagnosis }) => (
  <TranslatedReferenceData
    fallback={diagnosis.name}
    value={diagnosis.id}
    category="diagnosis"
    data-testid="translatedreferencedata-diagnosis"
  />
);

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

const getCertainty = ({ certainty }) => (
  <NoWrapCell data-testid="nowrapcell-certainty">
    <TranslatedEnum
      value={certainty}
      enumValues={DIAGNOSIS_CERTAINTY_LABELS}
      data-testid="translatedenum-certainty"
    />
  </NoWrapCell>
);

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

export const DiagnosisTable = React.memo(({ encounterId, onItemClick, refreshCount }) => (
  <StyledDataFetchingTable
    columns={COLUMNS}
    endpoint={`encounter/${encounterId}/diagnoses`}
    onRowClick={row => onItemClick(row)}
    elevated={false}
    allowExport={false}
    disablePagination
    initialSort={{ orderBy: 'isPrimary', order: 'desc' }}
    refreshCount={refreshCount}
    data-testid="datafetchingtable-diagnoses"
  />
));
