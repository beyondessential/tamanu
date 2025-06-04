import React, { useState } from 'react';
import { Box, Divider, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import styled from 'styled-components';
import { Print } from '@material-ui/icons';
import { BodyText, ConfirmCancelBackRow, Heading5, Modal, TranslatedText } from '..';
import { Colors } from '../../constants';
import { usePatientAllergiesQuery } from '../../api/queries/usePatientAllergiesQuery';
import { useEncounter } from '../../contexts/Encounter';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';
import { MedicationSetList, MedicationSetMedicationsList } from './MedicationSetList';
import { MedicationForm } from '../../forms/MedicationForm';
import { ADMINISTRATION_FREQUENCY_DETAILS } from '@tamanu/constants';
import { useCreateMedicationSetMutation } from '../../api/mutations/useMarMutation';
import { getCurrentDateString, getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useAuth } from '../../contexts/Auth';
import { MultiplePrescriptionPrintoutModal } from '../PatientPrinting/modals/MultiplePrescriptionPrintoutModal';
import { toast } from 'react-toastify';

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
  align-items: flex-end;
`;

const MODAL_SCREENS = {
  SELECT_MEDICATION_SET: 'select_medication_set',
  REVIEW_MEDICATION_SET: 'review_medication_set',
  EDIT_MEDICATION: 'edit_medication',
  REMOVE_MEDICATION: 'remove_medication',
  DISCARD_CHANGES: 'discard_changes',
  CANCEL_MEDICATION_SET: 'cancel_medication_set',
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

const CancelMedicationSetScreen = () => {
  return (
    <Box width="80%" mt="78px" mb="96px" mx="auto">
      <BodyText>
        <TranslatedText
          stringId="medication.modal.cancelMedicationSet.description"
          fallback="Are you sure you would like to cancel creating the new medication set prescription?"
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
      <SetContainer>
        <Box flex={1}>
          <BodyText color={Colors.darkText}>
            <TranslatedText
              stringId="medication.modal.medicationSet.description"
              fallback="Select the medication set you would like to prescribe. You will be able to edit the prescription or remove any unneeded medications on the next screen."
            />
          </BodyText>
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

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: 14px;
  top: 14px;
  svg {
    font-size: 2rem;
  }
`;

export const MedicationSetModal = ({ open, onClose, openPrescriptionTypeModal, onReloadTable }) => {
  const { encounter } = useEncounter();
  const { ability, currentUser } = useAuth();
  const { data: allergies } = usePatientAllergiesQuery(encounter?.patientId);
  const { data: medicationSets, isLoading: medicationSetsLoading } = useSuggestionsQuery(
    'medicationSet',
  );
  const [isDirty, setIsDirty] = useState(false);

  const {
    mutateAsync: createMedicationSet,
    isLoading: isCreatingMedicationSet,
  } = useCreateMedicationSetMutation({
    onSuccess: () => onReloadTable(),
  });
  const [selectedMedicationSet, setSelectedMedicationSet] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);
  const [screen, setScreen] = useState(MODAL_SCREENS.SELECT_MEDICATION_SET);

  const onSelect = medicationSet => {
    const newMedicationSetChildren = medicationSet.children
      .map(({ medicationTemplate }) => ({
        ...medicationTemplate,
        idealTimes: ADMINISTRATION_FREQUENCY_DETAILS[medicationTemplate.frequency].startTimes || [],
        startDate: getCurrentDateTimeString(),
        date: getCurrentDateString(),
        prescriberId: currentUser.id,
        ...(medicationTemplate.doseAmount && {
          doseAmount: Number(medicationTemplate.doseAmount),
        }),
        ...(medicationTemplate.durationValue && {
          durationValue: Number(medicationTemplate.durationValue),
        }),
      }))
      .sort((a, b) => a.medication.name.localeCompare(b.medication.name));
    setSelectedMedicationSet({
      ...medicationSet,
      children: newMedicationSetChildren,
    });
  };
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const canPrintPrescription = ability.can('read', 'Medication');

  const onSubmit = async (isPrinting = false) => {
    const payload = {
      encounterId: encounter.id,
      medicationSet: selectedMedicationSet.children.map(child => ({
        ...child,
        doseAmount: Number(child.doseAmount) || null,
        durationValue: Number(child.durationValue) || null,
        durationUnit: child.durationUnit || null,
      })),
    };
    try {
      await createMedicationSet(payload);
      if (!isPrinting) {
        onClose();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onEdit = medication => {
    setEditingMedication(medication);
    setScreen(MODAL_SCREENS.EDIT_MEDICATION);
  };

  const onNext = async () => {
    switch (screen) {
      case MODAL_SCREENS.SELECT_MEDICATION_SET:
        setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
        break;
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        await onSubmit();
        break;
      case MODAL_SCREENS.REMOVE_MEDICATION: {
        const index = selectedMedicationSet.children.findIndex(
          child => child.id === editingMedication.id,
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
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
        break;
    }
  };

  const onBack = () => {
    switch (screen) {
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        if (isDirty) {
          setScreen(MODAL_SCREENS.DISCARD_CHANGES);
        } else {
          setScreen(MODAL_SCREENS.SELECT_MEDICATION_SET);
        }
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
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        setScreen(MODAL_SCREENS.SELECT_MEDICATION_SET);
        setSelectedMedicationSet(null);
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
      child => child.id === editingMedication.id,
    );
    selectedMedicationSet.children[medicationIndex] = {
      ...data,
    };
    setSelectedMedicationSet(selectedMedicationSet);
  };

  const onFinalise = async () => {
    await onSubmit(true);
    setPrintModalOpen(true);
  };

  const onCustomClose = () => {
    switch (screen) {
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        setScreen(MODAL_SCREENS.REVIEW_MEDICATION_SET);
        break;
      default:
        setScreen(MODAL_SCREENS.CANCEL_MEDICATION_SET);
    }
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
            onCustomClose={onCustomClose}
            onDirtyChange={dirty => setIsDirty(dirty)}
          />
        );
      case MODAL_SCREENS.REMOVE_MEDICATION:
        return <RemoveScreen medicationName={editingMedication.medication.name} />;
      case MODAL_SCREENS.DISCARD_CHANGES:
        return <DiscardChangesScreen />;
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        return <CancelMedicationSetScreen />;
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
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        return (
          <TranslatedText
            stringId="medication.modal.action.cancelMedicationSet"
            fallback="Cancel medication set"
          />
        );
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        return (
          <TranslatedText stringId="medication.modal.action.finaliseAll" fallback="Finalise all" />
        );
      default:
        return <TranslatedText stringId="general.action.continue" fallback="Continue" />;
    }
  };

  const getCancelText = () => {
    switch (screen) {
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        return (
          <TranslatedText
            stringId="medication.modal.action.backToMedicationSet"
            fallback="Back to creating medication set"
          />
        );
      default:
        return <TranslatedText stringId="general.action.cancel" fallback="Cancel" />;
    }
  };

  const getModalTitle = () => {
    switch (screen) {
      case MODAL_SCREENS.DISCARD_CHANGES:
        return (
          <TranslatedText
            stringId="medication.modal.discardChanges.title"
            fallback="Discard changes to medication set"
          />
        );
      case MODAL_SCREENS.REMOVE_MEDICATION:
        return (
          <TranslatedText
            stringId="medication.modal.removeMedication.title"
            fallback="Remove medication"
          />
        );
      case MODAL_SCREENS.EDIT_MEDICATION:
        return selectedMedicationSet.name;
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        return (
          <TranslatedText
            stringId="medication.modal.reviewMedicationSet.title"
            fallback="Review medication set"
          />
        );
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        return (
          <TranslatedText
            stringId="medication.modal.cancelMedicationSet.title"
            fallback="Cancel new medication set"
          />
        );
      default:
        return (
          <TranslatedText
            stringId="medication.modal.selectMedicationSet.title"
            fallback="Select medication set"
          />
        );
    }
  };

  const showCustomClose = [
    MODAL_SCREENS.REVIEW_MEDICATION_SET,
    MODAL_SCREENS.EDIT_MEDICATION,
    MODAL_SCREENS.CANCEL_MEDICATION_SET,
  ].includes(screen);

  const getModalWidth = () => {
    switch (screen) {
      case MODAL_SCREENS.SELECT_MEDICATION_SET:
        if (selectedMedicationSet) {
          return '986px';
        }
        break;
      case MODAL_SCREENS.REVIEW_MEDICATION_SET:
        return '640px';
      case MODAL_SCREENS.CANCEL_MEDICATION_SET:
        return '708px';
      default:
        return '600px';
    }
  };

  return (
    <StyledModal
      open={open}
      onClose={onClose}
      title={getModalTitle()}
      cornerExitButton={!showCustomClose}
      $maxWidth={getModalWidth()}
    >
      {showCustomClose && (
        <StyledIconButton onClick={onCustomClose}>
          <CloseIcon />
        </StyledIconButton>
      )}
      {printModalOpen && (
        <MultiplePrescriptionPrintoutModal
          encounter={encounter}
          prescriberId={currentUser.id}
          prescriptions={selectedMedicationSet.children}
          open={true}
          onClose={() => {
            setPrintModalOpen(false);
            onClose();
          }}
        />
      )}
      {renderScreen()}
      {screen !== MODAL_SCREENS.EDIT_MEDICATION && (
        <>
          <StyledDivider />
          <ConfirmCancelBackRow
            confirmText={getConfirmText()}
            onConfirm={onNext}
            confirmDisabled={!selectedMedicationSet || isCreatingMedicationSet}
            cancelText={getCancelText()}
            onCancel={onCancel}
            backText={<TranslatedText stringId="general.action.back" fallback="Back" />}
            onBack={
              ![
                MODAL_SCREENS.REMOVE_MEDICATION,
                MODAL_SCREENS.DISCARD_CHANGES,
                MODAL_SCREENS.CANCEL_MEDICATION_SET,
              ].includes(screen) && onBack
            }
            finaliseText={
              <Box display="flex" alignItems="center" whiteSpace="nowrap">
                <Print />
                <TranslatedText
                  stringId="medication.modal.action.finaliseAllPrint"
                  fallback="Finalise all & print"
                />
              </Box>
            }
            finaliseDisabled={isCreatingMedicationSet}
            onFinalise={
              MODAL_SCREENS.REVIEW_MEDICATION_SET === screen && canPrintPrescription
                ? onFinalise
                : undefined
            }
          />
        </>
      )}
    </StyledModal>
  );
};
