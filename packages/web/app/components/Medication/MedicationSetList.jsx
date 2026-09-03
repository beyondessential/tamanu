import { IconButton } from '@material-ui/core';
import Skeleton from '@mui/material/Skeleton';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import React from 'react';
import styled from 'styled-components';

import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import {
  getDrugUnitLabel,
  getMedicationDoseDisplay,
  getTranslatedFrequency,
} from '@tamanu/shared/utils/medication';
import { TranslatedText, UnstyledHtmlButton, useTranslation } from '@tamanu/ui-components';
import { useEncounterMedicationQuery } from '../../api/queries/useEncounterMedicationQuery';
import { Colors } from '../../constants/styles';
import { useEncounter } from '../../contexts/Encounter';
import { BodyText, Heading4, SmallBodyText } from '../Typography';

const Card = styled.div`
  background-color: ${p => p.theme.palette.background.paper};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  flex-direction: column;
  flex-grow: 1;
  min-block-size: 20rem;
  overflow-y: auto;
  padding: 16px;
`;

const SetListItem = styled(UnstyledHtmlButton).attrs({ role: 'radio' })`
  align-items: center;
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid transparent;
  cursor: pointer;
  display: flex;
  inline-size: 100%;
  padding-block: 5px;
  padding-inline: 10px;
  position: relative;
  &:hover {
    background-color: ${p => p.theme.palette.action.hover};
  }
  &[aria-checked='true'] {
    border-color: ${p => p.theme.palette.primary.main};
  }
`;

const MedicationListItem = styled.li`
  & + & {
    margin-block-start: 10px;
  }
`;

const MedicationCard = styled.div`
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  padding-block: 16px;
  padding-inline: 20px;
  position: relative;
  > * + * {
    margin-block-start: 3px;
  }
`;

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: 16px;
  top: 16px;
  padding: 0;
  svg {
    width: 18px;
    height: 18px;
    color: ${Colors.primary};
  }
`;

const RemoveText = styled(BodyText)`
  text-decoration: underline;
  cursor: pointer;
  position: absolute;
  right: 16px;
  bottom: 16px;
`;

const CheckedLabel = styled(BodyText)`
  color: ${Colors.midText};
  display: flex;
  align-items: center;
  gap: 4px;
  svg {
    width: 16px;
    height: 16px;
  }
`;

export const MedicationSetList = ({
  medicationSets,
  isLoading,
  onSelect,
  selectedMedicationSet,
  style,
  ...props
}) => {
  return (
    <Card
      aria-busy={isLoading || undefined}
      role="radiogroup"
      style={{ padding: 6, ...style }}
      {...props}
    >
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => <Skeleton height={32} key={i} />)
        : medicationSets?.map(medicationSet => {
            const checked = selectedMedicationSet?.id === medicationSet.id;
            return (
              <SetListItem
                aria-checked={checked}
                key={medicationSet.id}
                onClick={() => void onSelect(medicationSet)}
              >
                {medicationSet.name}
                {checked && (
                  <CheckIcon color="primary" style={{ fontSize: 18, marginInlineStart: 'auto' }} />
                )}
              </SetListItem>
            );
          })}
    </Card>
  );
};

export const MedicationSetMedicationsList = ({
  medicationSet,
  editable = false,
  onEdit,
  onRemove,
  style,
  ...props
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const { data: { data: medications = [] } = {} } = useEncounterMedicationQuery(encounter?.id);
  const existingDrugIds = medications
    .filter(({ discontinued }) => !discontinued)
    .map(({ medication }) => medication?.id);

  return (
    <Card style={{ inlineSize: 420, ...style }} {...props}>
      <Heading4 textAlign="center" style={{ marginBlock: '0 16px' }}>
        {medicationSet.name}
      </Heading4>
      <ul role="list">
        {medicationSet.children.map(medication => {
          const {
            medication: medicationRef,
            route,
            frequency,
            notes,
            durationUnit,
            durationValue,
            isPrn,
            isOngoing,
            quantity,
            dispensingUnit,
          } = medication;
          const hasQuantity = quantity != null && quantity !== '';
          return (
            <MedicationListItem key={medicationRef.id}>
              <MedicationCard>
                <BodyText fontWeight="500">{medicationRef.name}</BodyText>
                {isOngoing && (
                  <CheckedLabel>
                    <CheckIcon color="primary" />
                    <TranslatedText
                      stringId="medication.model.ongoingMedication.label"
                      fallback="Ongoing medication"
                    />
                  </CheckedLabel>
                )}
                {isPrn && (
                  <CheckedLabel>
                    <CheckIcon color="primary" />
                    <TranslatedText
                      stringId="medication.model.prnMedication.label"
                      fallback="PRN medication"
                    />
                  </CheckedLabel>
                )}
                <BodyText sx={{ paddingRight: '52px' }}>
                  {[
                    getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation),
                    getTranslatedFrequency(frequency, getTranslation),
                    getEnumTranslation(DRUG_ROUTE_LABELS, route),
                    durationUnit && durationValue && `${durationValue} ${durationUnit}`, // nonbreaking space
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </BodyText>
                {hasQuantity && (
                  <BodyText color={Colors.midText}>
                    <TranslatedText
                      stringId="medication.dispensingQuantity.summary"
                      fallback="Dispensing quantity: :quantity :unit"
                      replacements={{
                        quantity,
                        unit: dispensingUnit
                          ? getDrugUnitLabel(dispensingUnit, quantity, getEnumTranslation)
                          : '',
                      }}
                    />
                  </BodyText>
                )}
                {notes && <BodyText color={Colors.midText}>{notes}</BodyText>}
                {editable && (
                  <>
                    <StyledIconButton onClick={() => onEdit(medication)}>
                      <EditIcon />
                    </StyledIconButton>
                    <RemoveText onClick={() => onRemove(medication)}>
                      <TranslatedText stringId="general.action.remove" fallback="Remove" />
                    </RemoveText>
                  </>
                )}
              </MedicationCard>
              {existingDrugIds.includes(medicationRef.id) && editable && (
                <SmallBodyText mx="16px" mt="2px" color={Colors.darkText} component="aside">
                  <TranslatedText
                    stringId="medication.warning.existingDrug"
                    fallback="Please be aware that this medicine has already been prescribed for this encounter. Double check that this is clinically appropriate."
                  />
                </SmallBodyText>
              )}
            </MedicationListItem>
          );
        })}
      </ul>
    </Card>
  );
};
