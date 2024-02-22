import React from 'react';
import { addDays, parseISO } from 'date-fns';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { FormModal } from './FormModal';
import { ProcedureForm } from '../forms/ProcedureForm';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

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
  const locationSuggester = new Suggester(api, 'location', {
    baseQueryParameters: { filterByFacility: true },
  });
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const procedureSuggester = new Suggester(api, 'procedureType');
  const anaestheticSuggester = new Suggester(api, 'drug');

  return (
    <FormModal
      width="md"
      title={`${editedProcedure?.id ? 'Edit' : 'New'} procedure`}
      open={!!editedProcedure}
      onClose={onClose}
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
        locationSuggester={locationSuggester}
        practitionerSuggester={practitionerSuggester}
        procedureSuggester={procedureSuggester}
        anaestheticSuggester={anaestheticSuggester}
      />
    </FormModal>
  );
};
