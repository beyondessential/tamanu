import React, { useMemo } from 'react';

import { VisuallyHidden } from '@tamanu/ui-components';
import { useAuth } from '../contexts/Auth';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MenuButton } from './MenuButton';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';
import { TranslatedText, TranslatedReferenceData } from './Translation';

const getProcedureLabel = ({ procedureType }) => (
  <TranslatedReferenceData
    fallback={procedureType.name}
    value={procedureType.id}
    category={procedureType.type}
    data-testid="translatedreferencedata-lr6h"
  />
);
const getCodeLabel = ({ procedureType }) => procedureType.code;

const COLUMNS = [
  {
    key: 'date',
    title: (
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
        data-testid="translatedtext-c361"
      />
    ),
    accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-te7h" />,
  },
  {
    key: 'procedureType.code',
    title: (
      <TranslatedText
        stringId="procedure.table.column.code"
        fallback="Code"
        data-testid="translatedtext-29pa"
      />
    ),
    accessor: getCodeLabel,
  },
  {
    key: 'procedureType.name',
    title: (
      <TranslatedText
        stringId="procedure.table.column.name"
        fallback="Procedure"
        data-testid="translatedtext-jrum"
      />
    ),
    accessor: getProcedureLabel,
  },
];

// spec: PROC#actions-menu
const buildActionsColumn = onDelete => ({
  key: 'actions',
  title: (
    <VisuallyHidden>
      <TranslatedText stringId="general.table.column.actions" fallback="Actions" />
    </VisuallyHidden>
  ),
  numeric: true, // Not really, but right-aligns the menu at the far end of the row
  dontCallRowInput: true,
  sortable: false,
  isExportable: false,
  CellComponent: ({ data }) => (
    <MenuButton
      a11yLabel={<TranslatedText stringId="procedure.table.actions" fallback="Procedure actions" />}
      actions={[
        {
          label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
          action: () => onDelete(data),
          wrapper: menuItem => <NoteModalActionBlocker>{menuItem}</NoteModalActionBlocker>,
        },
      ]}
      buttonTestId="menubutton-procedure-actions"
    />
  ),
});

export const ProcedureTable = React.memo(
  ({ encounterId, onItemClick, onDeleteItem, refreshCount }) => {
    const { ability } = useAuth();
    const canDeleteProcedure = Boolean(ability?.can('delete', 'Procedure'));
    const columns = useMemo(
      () => (canDeleteProcedure ? [...COLUMNS, buildActionsColumn(onDeleteItem)] : COLUMNS),
      [canDeleteProcedure, onDeleteItem],
    );

    return (
      <DataFetchingTable
        columns={columns}
        endpoint={`encounter/${encounterId}/procedures`}
        onRowClick={row => onItemClick(row)}
        elevated={false}
        initialSort={{ orderBy: 'date', order: 'desc' }}
        refreshCount={refreshCount}
        data-testid="datafetchingtable-ks0b"
      />
    );
  },
);
