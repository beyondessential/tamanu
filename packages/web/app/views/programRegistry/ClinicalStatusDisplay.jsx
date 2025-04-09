import React from 'react';
import { STATUS_COLOR } from '@tamanu/constants';
import { TableCellTag, TranslatedText, TranslatedReferenceData } from '../../components';
import { ThemedTooltip } from '../../components/Tooltip';

export const ClinicalStatusDisplay = ({ clinicalStatus }) => {
  if (!clinicalStatus) return <></>;
  const color = STATUS_COLOR[clinicalStatus.color];
  return (
    <ThemedTooltip
      visible
      title={
        <TranslatedText
          stringId="programRegistry.currentStatus.tooltip"
          fallback="Current status"
          data-testid='translatedtext-ms05' />
      }
      data-testid='themedtooltip-ldih'>
      <TableCellTag $color={color} $position="initial" data-testid='tablecelltag-02cm'>
        <TranslatedReferenceData
          fallback={clinicalStatus?.name}
          value={clinicalStatus?.id}
          category="programRegistryClinicalStatus"
          placeholder={
            <TranslatedText
              stringId="programRegistry.currentStatus.placeholder"
              fallback="n/a"
              data-testid='translatedtext-wq0e' />
          }
          data-testid='translatedreferencedata-habj' />
      </TableCellTag>
    </ThemedTooltip>
  );
};

export const ClinicalStatusCell = ({ data }) => {
  return <ClinicalStatusDisplay clinicalStatus={data.clinicalStatus} />;
};
