import { tableCellClasses } from '@mui/material/TableCell';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { DataFetchingTable, TranslatedText } from '../../../../components';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { EditProgramRegistryTableRecordModal } from './EditProgramRegistryTableRecordModal';
import { useVisibilityStatusMutation } from './useVisibilityStatusMutation';

export const StyledDataFetchingTable = styled(DataFetchingTable).attrs({
  allowExport: false,
})`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;

  .${tableCellClasses.body} {
    padding-block: 16px;
  }
`;

/**
 * @param {'programRegistryClinicalStatus' | 'programRegistryCondition' | 'programRegistryConditionCategory'} resourceSegment
 * @param {{ fields: ReadonlyArray<{ key: string; title?: React.ReactNode }>; title: string }} editModal
 */
export function createProgramRegistryRowActionsAccessor(resourceSegment, editModal) {
  return function ProgramRegistryRowActionsCell(row) {
    const { id, refreshTable, visibilityStatus, code, name, color } = row;
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { isLoading, mutateAsync } = useVisibilityStatusMutation({
      onSuccess: () => refreshTable?.(),
    });

    const updateVisibilityStatus = async next =>
      await mutateAsync({ recordId: id, resourceSegment, visibilityStatus: next });

    const items = [
      {
        label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
        onClick: () => setIsEditOpen(true),
      },
    ];

    if (visibilityStatus === VISIBILITY_STATUSES.CURRENT) {
      items.push({
        disabled: isLoading,
        label: (
          <TranslatedText
            stringId="admin.programRegistries.table.action.makeHistorical"
            fallback="Make historical"
          />
        ),
        onClick: () => updateVisibilityStatus(VISIBILITY_STATUSES.HISTORICAL),
      });
    } else if (visibilityStatus === VISIBILITY_STATUSES.HISTORICAL) {
      items.push({
        disabled: isLoading,
        label: (
          <TranslatedText
            stringId="admin.programRegistries.table.action.makeCurrent"
            fallback="Make current"
          />
        ),
        onClick: () => updateVisibilityStatus(VISIBILITY_STATUSES.CURRENT),
      });
    }

    /** Color applies only to programRegistryClinicalStatus; but harmless to attach as undefined */
    const record = useMemo(
      () => ({ code, color, id, name, visibilityStatus }),
      [code, color, id, name, visibilityStatus],
    );

    return (
      <>
        <ThreeDotMenu items={items} />
        {isEditOpen && (
          <EditProgramRegistryTableRecordModal
            fields={editModal.fields}
            onClose={() => setIsEditOpen(false)}
            onSave={() => refreshTable?.()}
            open
            record={record}
            resourceSegment={resourceSegment}
            title={editModal.title}
          />
        )}
      </>
    );
  };
}

export function ColorCell({ color }) {
  return (
    color || (
      <em style={{ color: TAMANU_COLORS.softText }}>
        <TranslatedText stringId="general.none" fallback="None" />
      </em>
    )
  );
}
