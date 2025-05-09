import React, { useState } from 'react';

import { useApi, useSuggester } from '../api';
import { FormModal } from './FormModal';
import { MedicationForm } from '../forms/MedicationForm';
import { getCurrentDateString } from '../utils/dateTime';
import { TranslatedText } from './Translation/TranslatedText';

export const MedicationModal = ({ open, onClose, onSaved, encounterId, medication, readOnly }) => {
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const drugSuggester = useSuggester('drug');
  const [shouldDiscontinue, setShouldDiscontinue] = useState(false);
  const [submittedMedication, setSubmittedMedication] = useState(null);
  const onDiscontinue = () => {
    setShouldDiscontinue(true);
  };

  const onDiscontinueSubmit = async (data, awaitingPrint) => {
    const payload = {
      discontinuingClinicianId: data?.discontinuingClinicianId,
      discontinuingReason: data?.discontinuingReason,
      discontinued: !!data?.discontinuingClinicianId,
      discontinuedDate: getCurrentDateString(),
    };
    await api.put(`medication/${medication.id}`, payload);

    // The return from the put doesn't include the joined tables like medication and prescriber
    const newMedication = await api.get(`medication/${medication.id}`);

    setSubmittedMedication(newMedication);
    if (!awaitingPrint) {
      setShouldDiscontinue(false);
      onClose();
    }
  };

  const onSaveSubmit = async (data) => {
    const medicationSubmission = await api.post('medication', {
      ...data,
      encounterId,
    });
    // The return from the post doesn't include the joined tables like medication and prescriber
    const newMedication = await api.get(`medication/${medicationSubmission.id}`);

    setSubmittedMedication(newMedication);
  };

  return (
    <FormModal
      title={
        !readOnly ? (
          <TranslatedText
            stringId="medication.modal.prescribe.title"
            fallback="Prescribe medication"
            data-testid="translatedtext-93od"
          />
        ) : (
          <TranslatedText
            stringId="medication.modal.details.title"
            fallback="Medication details"
            data-testid="translatedtext-8rur"
          />
        )
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-a7ba"
    >
      <MedicationForm
        onSubmit={readOnly ? onDiscontinueSubmit : onSaveSubmit}
        medication={medication}
        submittedMedication={submittedMedication}
        onCancel={() => {
          setShouldDiscontinue(false);
          onClose();
        }}
        onSaved={onSaved}
        readOnly={readOnly}
        practitionerSuggester={practitionerSuggester}
        onDiscontinue={onDiscontinue}
        shouldDiscontinue={shouldDiscontinue}
        drugSuggester={drugSuggester}
        data-testid="medicationform-cc6b"
      />
    </FormModal>
  );
};
