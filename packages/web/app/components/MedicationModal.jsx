import React, { useState } from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { FormModal } from './FormModal';
import { MedicationForm } from '../forms/MedicationForm';
import { getCurrentDateString } from '../utils/dateTime';
import { TranslatedText } from './Translation/TranslatedText';

export const MedicationModal = ({ open, onClose, onSaved, encounterId, medication, readOnly }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const drugSuggester = new Suggester(api, 'drug');
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

  const onSaveSubmit = async data => {
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
          />
        ) : (
          <TranslatedText stringId="medication.modal.details.title" fallback="Medication details" />
        )
      }
      open={open}
      onClose={onClose}
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
      />
    </FormModal>
  );
};
