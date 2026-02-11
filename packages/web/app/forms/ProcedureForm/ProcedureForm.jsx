import React, { useEffect } from 'react';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import MuiDivider from '@material-ui/core/Divider';
import { useFormikContext } from 'formik';
import { addDays, parseISO } from 'date-fns';
import { toDateString } from '@tamanu/utils/dateTime';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  LocationField,
  TimeField,
} from '../../components/Field';
import { TextField, FormGrid } from '@tamanu/ui-components';
import { MultiAutocompleteField } from '../../components/Field/MultiAutocompleteField';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useSuggester } from '../../api';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';

const Divider = styled(MuiDivider)`
  margin: 10px 0 20px;
`;

/**
 * Keeps time field dates in sync with the procedure date field.
 * When an end time (endTime/timeOut) is earlier than its reference start time
 * (startTime/timeIn), the date portion is rolled forward to the next day.
 * Non-rollover time fields are synced to the procedure date.
 */
const syncTimeDate = (time, targetDate, setFieldValue, fieldName) => {
  if (!time) return;
  const timePart = time.slice(11);
  const expected = `${targetDate}T${timePart}`;
  if (time !== expected) {
    setFieldValue(fieldName, expected);
  }
};

const isRollover = (time, refTime) => time && refTime && time.slice(11, 16) < refTime.slice(11, 16);

const ProcedureDateSync = () => {
  const { values, setFieldValue } = useFormikContext();
  const { date: dateVal, startTime, endTime, timeIn, timeOut } = values;
  const date = dateVal?.slice(0, 10);

  useEffect(() => {
    if (!date) return;
    const nextDay = toDateString(addDays(parseISO(date), 1));

    syncTimeDate(startTime, date, setFieldValue, 'startTime');
    syncTimeDate(
      endTime,
      isRollover(endTime, startTime) ? nextDay : date,
      setFieldValue,
      'endTime',
    );
    syncTimeDate(timeIn, date, setFieldValue, 'timeIn');
    syncTimeDate(timeOut, isRollover(timeOut, timeIn) ? nextDay : date, setFieldValue, 'timeOut');
  }, [date, startTime, endTime, timeIn, timeOut, setFieldValue]);

  return null;
};

export const ProcedureFormFields = React.memo(({ values }) => {
  const physicianSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const anaesthetistSuggester = useSuggester('practitioner');
  const assistantSuggester = useSuggester('practitioner');
  const procedureSuggester = useSuggester('procedureType');
  const anaestheticSuggester = useSuggester('drug');

  return (
    <>
      <ProcedureDateSync />
      <FormGrid data-testid="formgrid-6sdo">
        <div style={{ gridColumn: 'span 2' }}>
          <NoteModalActionBlocker>
            <Field
              name="procedureTypeId"
              label={
                <TranslatedText stringId="procedure.procedureType.label" fallback="Procedure" />
              }
              required
              component={AutocompleteField}
              suggester={procedureSuggester}
              data-testid="field-87c2"
            />
          </NoteModalActionBlocker>
        </div>
        <NoteModalActionBlocker>
          <Field
            name="date"
            label={<TranslatedText stringId="procedure.date.label" fallback="Procedure date" />}
            saveDateAsString
            required
            component={DateField}
            data-testid="field-3a5v"
          />
          <Field
            name="departmentId"
            label={<TranslatedText stringId="procedure.department.label" fallback="Department" />}
            suggester={departmentSuggester}
            component={AutocompleteField}
            data-testid="field-3a5v1"
          />
        </NoteModalActionBlocker>
        <Field
          locationGroupLabel={
            <TranslatedText stringId="procedure.area.label" fallback="Procedure area" />
          }
          label={
            <TranslatedText stringId="procedure.location.label" fallback="Procedure location" />
          }
          name="locationId"
          enableLocationStatus={false}
          required
          component={LocationField}
          wrapInNoteModalActionBlocker
          data-testid="field-p4ef"
        />
        <NoteModalActionBlocker>
          <Field
            name="physicianId"
            label={
              <TranslatedText
                stringId="general.localisedField.leadClinician.label"
                fallback="Lead clinician"
              />
            }
            required
            component={AutocompleteField}
            suggester={physicianSuggester}
            data-testid="field-lit6"
          />
          <Field
            name="assistantClinicianIds"
            label={
              <TranslatedText
                stringId="procedure.assistantClinicians.label"
                fallback="Assistant clinicians"
              />
            }
            component={MultiAutocompleteField}
            suggester={assistantSuggester}
            data-testid="field-f3l4"
          />
          <Field
            name="anaesthetistId"
            label={
              <TranslatedText stringId="procedure.anaesthetist.label" fallback="Anaesthetist" />
            }
            component={AutocompleteField}
            suggester={anaesthetistSuggester}
            data-testid="field-96eg"
          />
          <Field
            name="assistantAnaesthetistId"
            label={
              <TranslatedText
                stringId="procedure.assistantAnaesthetist.label"
                fallback="Assistant Anaesthetist"
              />
            }
            component={AutocompleteField}
            suggester={anaesthetistSuggester}
            data-testid="field-96eg1"
          />
          <Field
            name="anaestheticId"
            label={
              <TranslatedText stringId="procedure.anaesthetic.label" fallback="Anaesthetic type" />
            }
            component={AutocompleteField}
            suggester={anaestheticSuggester}
            data-testid="field-w9b5"
          />
          {/* Empty div to make the time in field start on a new row */}
          <div />
          <Field
            name="timeIn"
            label={<TranslatedText stringId="procedure.timeIn.label" fallback="Time in" />}
            component={TimeField}
            saveDateAsString
            data-testid="field-khml1"
          />
          <Field
            name="timeOut"
            label={<TranslatedText stringId="procedure.timeOut.label" fallback="Time out" />}
            component={TimeField}
            saveDateAsString
            data-testid="field-hgzz1"
          />
          <Field
            name="startTime"
            label={<TranslatedText stringId="procedure.startTime.label" fallback="Time started" />}
            component={TimeField}
            saveDateAsString
            data-testid="field-khml"
          />
          <Field
            name="endTime"
            label={<TranslatedText stringId="procedure.endTime.label" fallback="Time ended" />}
            component={TimeField}
            saveDateAsString
            data-testid="field-hgzz"
          />
        </NoteModalActionBlocker>
        <div style={{ gridColumn: 'span 2' }}>
          <NoteModalActionBlocker>
            <Field
              name="note"
              label={
                <TranslatedText
                  stringId="procedure.noteOrInstruction.label"
                  fallback="Notes or additional instructions"
                />
              }
              component={TextField}
              multiline
              minRows={4}
              data-testid="field-7en7"
            />
          </NoteModalActionBlocker>
        </div>
        <NoteModalActionBlocker>
          <Field
            name="completed"
            label={<TranslatedText stringId="general.completed.label" fallback="Completed" />}
            component={CheckField}
            data-testid="field-uaz4"
          />
        </NoteModalActionBlocker>
        <Collapse
          in={!!values.completed}
          style={{ gridColumn: 'span 2' }}
          data-testid="collapse-e9ow"
        >
          <NoteModalActionBlocker>
            <Field
              name="completedNote"
              label={
                <TranslatedText
                  stringId="procedure.completedNote.label"
                  fallback="Notes on completed procedure"
                />
              }
              component={TextField}
              multiline
              minRows={4}
              data-testid="field-qrv7"
            />
          </NoteModalActionBlocker>
        </Collapse>
      </FormGrid>
      <Divider />
    </>
  );
});
