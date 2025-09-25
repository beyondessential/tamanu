import React from 'react';
import styled from 'styled-components';
import CheckIcon from '@material-ui/icons/Check';
import { Box, IconButton } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { BodyText, Heading4, SmallBodyText } from '..';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { useTranslation } from '../../contexts/Translation';
import { useEncounterMedicationQuery } from '../../api/queries/useEncounterMedicationQuery';
import { useEncounter } from '../../contexts/Encounter';

const ListContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 0px;
  border-radius: 3px;
  background-color: ${Colors.white};
  height: calc(100vh - 444px);
  border: 1px solid ${Colors.outline};
  overflow-y: auto;
`;

const ListItem = styled.div`
  cursor: pointer;
  width: 100%;
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: relative;
`;

const MedicationListItem = styled.div`
  padding: 16px 20px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0px 16px;
  position: relative;
`;

const SelectOverlay = styled.div`
  position: absolute;
  left: 6px;
  top: 0;
  border: 1px solid ${Colors.primary};
  border-radius: 5px;
  width: calc(100% - 12px);
  height: 100%;
  svg {
    position: absolute;
    right: 18px;
    top: 4px;
    width: 18px;
    height: 18px;
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
}) => {
  if (isLoading)
    return (
      <ListContainer>
        <BodyText pl="16px">
          <TranslatedText stringId="general.table.loading" fallback="Loading..." />
        </BodyText>
      </ListContainer>
    );
  return (
    <ListContainer>
      {medicationSets?.map(medicationSet => (
        <ListItem
          key={medicationSet.id}
          onClick={() => onSelect(medicationSet)}
          selected={selectedMedicationSet?.id === medicationSet.id}
        >
          {selectedMedicationSet?.id === medicationSet.id && (
            <SelectOverlay>
              <CheckIcon color="primary" />
            </SelectOverlay>
          )}
          <BodyText>{medicationSet.name}</BodyText>
        </ListItem>
      ))}
    </ListContainer>
  );
};

export const MedicationSetMedicationsList = ({
  medicationSet,
  editable = false,
  onEdit,
  onRemove,
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const { data: { data: medications = [] } = {} } = useEncounterMedicationQuery(encounter?.id);
  const existingDrugIds = medications
    .filter(({ discontinued }) => !discontinued)
    .map(({ medication }) => medication?.id);

  return (
    <ListContainer width="420px">
      <Heading4 textAlign="center" mt="6px" mb="2px">
        {medicationSet.name}
      </Heading4>
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
        } = medication;
        return (
          <div key={medicationRef.id}>
            <MedicationListItem>
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
                  durationUnit && durationValue && `${durationValue} ${durationUnit}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </BodyText>
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
            </MedicationListItem>
            {existingDrugIds.includes(medicationRef.id) && editable && (
              <SmallBodyText mx="16px" mt="2px" color={Colors.darkText}>
                <TranslatedText
                  stringId="medication.warning.existingDrug"
                  fallback="Please be aware that this medicine has already been prescribed for this encounter. Double check that this is clinically appropriate."
                />
              </SmallBodyText>
            )}
          </div>
        );
      })}
    </ListContainer>
  );
};
