import React, { useState } from 'react';
import { Box, Divider } from '@material-ui/core';
import styled from 'styled-components';
import { BodyText, ConfirmCancelBackRow, Heading5, Modal, TranslatedText } from '..';
import { Colors } from '../../constants';
import { usePatientAllergiesQuery } from '../../api/queries/usePatientAllergiesQuery';
import { useEncounter } from '../../contexts/Encounter';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';
import { MedicationSetList, MedicationSetMedicationsList } from './MedicationSetList';
import { MedicationForm } from '../../forms/MedicationForm';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const StyledModal = styled(Modal)`
  .MuiDialog-paper {
    max-width: ${({ $maxWidth }) => $maxWidth};
  }
`;

const SetContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const MODAL_SCREENS = {
  SELECT_MEDICATION_SET: 'select_medication_set',
  REVIEW_MEDICATION_SET: 'review_medication_set',
  EDIT_MEDICATION: 'edit_medication',
  REMOVE_MEDICATION: 'remove_medication',
  DISCARD_CHANGES: 'discard_changes',
};

const RemoveScreen = ({ medicationName }) => {
  return (
    <Box width="80%" mt="78px" mb="96px" mx="auto">
      <BodyText>
        <TranslatedText
          stringId="medication.modal.removeMedication.description"
          fallback="Are you sure you would like to remove :medicationName from the medication set prescription?"
          replacements={{ medicationName }}
        />
      </BodyText>
    </Box>
  );
};

const DiscardChangesScreen = () => {
  return (
    <Box width="80%" mt="78px" mb="96px" mx="auto">
      <BodyText>
        <TranslatedText
          stringId="medication.modal.discardChanges.description"
          fallback="Going back will loose any changes made to the medication set prescriptions. Are you sure you would like to go back and discard changes?"
        />
      </BodyText>
    </Box>
  );
};
const SelectScreen = ({
  allergies,
  medicationSets,
  medicationSetsLoading,
  onSelect,
  selectedMedicationSet,
}) => {
  return (
    <>
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
        <Box flex={1}>
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
          <Box>
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
    </>
  );
};

const ReviewScreen = ({ selectedMedicationSet, onEdit, onRemove }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <BodyText color={Colors.darkText} mb="25px">
        <TranslatedText
          stringId="medication.modal.reviewMedicationSet.description"
          fallback="Select a medication below to review and/or edit the prescription."
        />
      </BodyText>
      <MedicationSetMedicationsList
        medicationSet={selectedMedicationSet}
        editable
        onEdit={onEdit}
        onRemove={onRemove}
      />
    </Box>
  );
};

export const MedicationSetModal = ({ open, onClose, openPrescriptionTypeModal }) => {
  const { encounter } = useEncounter();
  const { data: allergies } = usePatientAllergiesQuery(encounter?.patientId);
  const { data: medicationSets, isLoading: medicationSetsLoading } = useSuggestionsQuery(
    'medicationSet',
  );
  const [selectedMedicationSet, setSelectedMedicationSet] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);

  const [screen, setScreen] = useState(MODAL_SCREENS.SELECT_MEDICATION_SET);
  const onSelect = medicationSet => {
    setSelectedMedicationSet(medicationSet);
  };

  const onSubmit = () => {
    const payload = {
      medicationSet: selectedMedicationSet.children.map(({ medicationTemplate }) => ({
        ...medicationTemplate,
      })),
    };
    console.log('payload', payload);
  };

  const onEdit = medication => {
    setEditingMedication(medication);
    setScreen(MODAL_SCREENS.EDIT_MEDICATION);
  };

  const onNext = () => {
    switch (screen) {
      case MODAL_SCREENS.SELECT_MEDICATION_SET:
        setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
        break;
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        onSubmit();
        break;
      case MODAL_SCREENS.REMOVE_MEDICATION: {
        const index = selectedMedicationSet.children.findIndex(
          child => child.medicationTemplate.id === editingMedication.id,
        );
        selectedMedicationSet.children.splice(index, 1);
        setSelectedMedicationSet(selectedMedicationSet);
        setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
        break;
      }
      case MODAL_SCREENS.DISCARD_CHANGES:
        setScreen(MODAL_SCREENS.SELECT_MEDICATION_SET);
        setSelectedMedicationSet(null);
        break;
    }
  };

  const onBack = () => {
    switch (screen) {
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        setScreen(MODAL_SCREENS.DISCARD_CHANGES);
        break;
      case MODAL_SCREENS.SELECT_MEDICATION_SET:
        openPrescriptionTypeModal();
        onClose();
        break;
    }
  };

  const onCancel = () => {
    switch (screen) {
      case MODAL_SCREENS.EDIT_MEDICATION:
        setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
        break;
      case MODAL_SCREENS.REMOVE_MEDICATION:
        setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
        break;
      default:
        onClose();
    }
  };

  const onRemoveMedication = medication => {
    setScreen(MODAL_SCREENS.REMOVE_MEDICATION);
    setEditingMedication(medication);
  };

  const onConfirmEdit = data => {
    setEditingMedication(null);
    setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
    const medicationIndex = selectedMedicationSet.children.findIndex(
      child => child.medicationTemplate.id === editingMedication.id,
    );
    selectedMedicationSet.children[medicationIndex].medicationTemplate = {
      ...data,
      route: DRUG_ROUTE_LABELS[data.route],
    };
    setSelectedMedicationSet(selectedMedicationSet);
  };

  const renderScreen = () => {
    switch (screen) {
      case MODAL_SCREENS.SELECT_MEDICATION_SET:
        return (
          <SelectScreen
            allergies={allergies}
            medicationSets={medicationSets}
            medicationSetsLoading={medicationSetsLoading}
            onSelect={onSelect}
            selectedMedicationSet={selectedMedicationSet}
          />
        );
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        return (
          <ReviewScreen
            selectedMedicationSet={selectedMedicationSet}
            onEdit={onEdit}
            onRemove={onRemoveMedication}
          />
        );
      case MODAL_SCREENS.EDIT_MEDICATION:
        return (
          <MedicationForm
            onConfirmEdit={onConfirmEdit}
            editingMedication={editingMedication}
            onCancelEdit={onCancel}
          />
        );
      case MODAL_SCREENS.REMOVE_MEDICATION:
        return <RemoveScreen medicationName={editingMedication.medication.name} />;
      case MODAL_SCREENS.DISCARD_CHANGES:
        return <DiscardChangesScreen />;
    }
  };

  const getConfirmText = () => {
    switch (screen) {
      case MODAL_SCREENS.REMOVE_MEDICATION:
        return (
          <TranslatedText
            stringId="medication.modal.action.removeMedication.confirm"
            fallback="Remove medication"
          />
        );
      case MODAL_SCREENS.DISCARD_CHANGES:
        return (
          <TranslatedText
            stringId="medication.modal.action.discardChanges.confirm"
            fallback="Discard changes"
          />
        );
      default:
        return <TranslatedText stringId="general.action.continue" fallback="Continue" />;
    }
  };

  const getModalTitle = () => {
    switch (screen) {
      case MODAL_SCREENS.DISCARD_CHANGES:
        return <TranslatedText stringId="medication.modal.discardChanges.title" fallback="Discard changes to medication set" />;
      case MODAL_SCREENS.REMOVE_MEDICATION:
        return <TranslatedText stringId="medication.modal.removeMedication.title" fallback="Remove medication" />;
      case MODAL_SCREENS.EDIT_MEDICATION:
        return selectedMedicationSet.name;
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        return <TranslatedText stringId="medication.modal.reviewMedicationSet.title" fallback="Review medication set" />;
      default:
        return <TranslatedText stringId="medication.modal.selectMedicationSet.title" fallback="Select medication set" />;
    }
  };

  return (
    <StyledModal
      open={open}
      onClose={onClose}
      title={getModalTitle()}
      $maxWidth={
        selectedMedicationSet && screen === MODAL_SCREENS.SELECT_MEDICATION_SET ? '986px' : '600px'
      }
    >
      {renderScreen()}
      {screen !== MODAL_SCREENS.EDIT_MEDICATION && (
        <>
          <StyledDivider />
          <ConfirmCancelBackRow
            confirmText={getConfirmText()}
            onConfirm={onNext}
            confirmDisabled={!selectedMedicationSet}
            cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
            onCancel={onCancel}
            backText={<TranslatedText stringId="general.action.back" fallback="Back" />}
            onBack={
              ![MODAL_SCREENS.REMOVE_MEDICATION, MODAL_SCREENS.DISCARD_CHANGES].includes(screen) &&
              onBack
            }
          />
        </>
      )}
    </StyledModal>
  );
};
