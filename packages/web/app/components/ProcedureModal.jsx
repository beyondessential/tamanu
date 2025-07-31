import React from 'react';
import { addDays, parseISO } from 'date-fns';

import { useApi, useSuggester } from '../api';

import { FormModal } from './FormModal';
import { ProcedureForm } from '../forms/ProcedureForm';
import { TranslatedText } from './Translation/TranslatedText';
import { toDateTimeString } from '@tamanu/utils/dateTime';

// Both date and startTime only keep track of either date or time, accordingly.
// This grabs both relevant parts for the table.
const getActualDateTime = (date, time) => {
  return `${date.slice(0, 10)} ${time.slice(-8)}`;
};

// endTime has the same caveat as startTime, this will fix it and
// make an educated guess if the procedure ended the next day.
const getEndDateTime = ({ date, startTime, endTime }) => {
  if (!endTime) return undefined;
  const actualEndDateTime = getActualDateTime(date, endTime);
  const startTimeString = startTime.slice(-8);
  const endTimeString = endTime.slice(-8);
  const isEndTimeEarlier = endTimeString < startTimeString;

  if (isEndTimeEarlier === false) return actualEndDateTime;
  return toDateTimeString(addDays(parseISO(actualEndDateTime), 1));
};

export const ProcedureModal = ({ onClose, onSaved, encounterId, editedProcedure }) => {
  const api = useApi();
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });
  const physicianSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');
  const anaesthetistSuggester = useSuggester('practitioner');
  const assistantSuggester = useSuggester('practitioner');
  const procedureSuggester = useSuggester('procedureType');
  const anaestheticSuggester = useSuggester('drug');

  return (
    <FormModal
      width="md"
      title={
        <TranslatedText
          stringId="procedure.modal.title"
          fallback=":action procedure"
          replacements={{
            action: editedProcedure?.id ? (
              <TranslatedText
                stringId="general.action.update"
                fallback="Update"
                data-testid="translatedtext-l65z"
              />
            ) : (
              <TranslatedText
                stringId="general.action.new"
                fallback="New"
                data-testid="translatedtext-c8x5"
              />
            ),
          }}
          data-testid="translatedtext-om64"
        />
      }
      open={!!editedProcedure}
      onClose={onClose}
      data-testid="formmodal-otam"
    >
      <ProcedureForm
        onSubmit={async data => {
          const actualDateTime = getActualDateTime(data.date, data.startTime);
          const updatedData = {
            ...data,
            date: actualDateTime,
            startTime: actualDateTime,
            endTime: getEndDateTime(data),
            encounterId,
          };

          if (updatedData.id) {
            await api.put(`procedure/${updatedData.id}`, updatedData);
          } else {
            await api.post('procedure', updatedData);
          }
          onSaved();
        }}
        onCancel={onClose}
        editedObject={editedProcedure}
        departmentSuggester={departmentSuggester}
        locationSuggester={locationSuggester}
        physicianSuggester={physicianSuggester}
        anaesthetistSuggester={anaesthetistSuggester}
        assistantSuggester={assistantSuggester}
        procedureSuggester={procedureSuggester}
        anaestheticSuggester={anaestheticSuggester}
        data-testid="procedureform-euca"
      />
    </FormModal>
  );
};
