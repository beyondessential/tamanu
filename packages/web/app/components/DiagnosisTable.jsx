import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from './Translation';
import { DIAGNOSIS_CERTAINTY_LABELS } from '@tamanu/constants';

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

const getClinician = ({ clinician }) => clinician?.displayName;

const getCertainty = ({ certainty }) => (
  <TranslatedEnum
    value={certainty}
    enumValues={DIAGNOSIS_CERTAINTY_LABELS}
    data-testid="translatedenum-certainty"
  />
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
  <DataFetchingTable
    columns={COLUMNS}
    endpoint={`encounter/${encounterId}/diagnoses`}
    onRowClick={row => onItemClick(row)}
    elevated={false}
    initialSort={{ orderBy: 'isPrimary', order: 'desc' }}
    refreshCount={refreshCount}
    data-testid="datafetchingtable-diagnoses"
  />
));
