import React, { useState } from 'react';
import { Box, Divider } from '@material-ui/core';
import styled from 'styled-components';
import {
  BodyText,
  ConfirmCancelBackRow,
  Heading5,
  Modal,
  TranslatedText,
} from '..';
import { Colors } from '../../constants';
import { usePatientAllergiesQuery } from '../../api/queries/usePatientAllergiesQuery';
import { useEncounter } from '../../contexts/Encounter';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';
import { MedicationSetList, MedicationSetMedicationsList } from './MedicationSetList';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const StyledModal = styled(Modal)`
  .MuiDialog-paper {
    max-width: ${({ selected }) => (!selected ? '565px' : '986px')};
  }
`;

const SetContainer = styled.div`
  display: flex;
  gap: 10px;
`;

export const MedicationSetModal = ({ open, onClose }) => {
  const { encounter } = useEncounter();
  const { data: allergies } = usePatientAllergiesQuery(encounter?.patientId);
  const { data: medicationSets, isLoading: medicationSetsLoading } = useSuggestionsQuery(
    'medicationSet',
  );
  const [selectedMedicationSet, setSelectedMedicationSet] = useState(null);
  console.log('selectedMedicationSet', selectedMedicationSet);
  const onSelect = medicationSet => {
    setSelectedMedicationSet(medicationSet);
  };
  return (
    <StyledModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.modal.medicationSet.title"
          fallback="Select medication set"
        />
      }
      selected={!!selectedMedicationSet}
    >
      <Box mb="10px" mt="22px">
        <BodyText component="span" color={Colors.midText}>
          <TranslatedText
            stringId="medication.modal.medicationSet.allergies"
            fallback="Allergies:"
          />
        </BodyText>{' '}
        <BodyText component="span" color={Colors.darkText} fontWeight="500">
          {allergies?.data?.map(allergy => allergy.allergy.name).join(', ')}
        </BodyText>
      </Box>
      <BodyText color={Colors.darkText}>
        <TranslatedText
          stringId="medication.modal.medicationSet.description"
          fallback="Please select whether you would like to create a single medication prescription or multiple prescriptions using a medication set."
        />
      </BodyText>
      <SetContainer>
        <Box flex={54}>
          <Heading5 color={Colors.darkText} mt="25px" mb={0}>
            <TranslatedText
              stringId="medication.modal.medicationSet.label"
              fallback="Medication set"
            />
          </Heading5>
          <MedicationSetList
            medicationSets={medicationSets}
            isLoading={medicationSetsLoading}
            onSelect={onSelect}
            selectedMedicationSet={selectedMedicationSet}
          />
        </Box>
        {selectedMedicationSet && (
          <Box flex={46}>
            <Heading5 color={Colors.darkText} mt="25px" mb={0}>
              <TranslatedText
                stringId="medication.modal.medicationSetMedications.label"
                fallback="Medication set medications"
              />
            </Heading5>
            <MedicationSetMedicationsList medicationSet={selectedMedicationSet} />
          </Box>
        )}
      </SetContainer>
      <StyledDivider />
      <ConfirmCancelBackRow
        confirmText={<TranslatedText stringId="general.action.continue" fallback="Continue" />}
        onConfirm={() => {}}
        cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        onCancel={onClose}
        backText={<TranslatedText stringId="general.action.back" fallback="Back" />}
        onBack={onClose}
      />
    </StyledModal>
  );
};
