import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import {
  Form,
  Field,
  TextField,
  AutocompleteField,
  DateField,
  RadioField,
  SelectField,
} from '../components/Field';
import { Colors } from '../constants';

const VaccineScheduleOptions = [
  { value: 'Routine', label: 'Routine' },
  { value: 'Catchup', label: 'Catch-Up' },
  { value: 'Campaign', label: 'Campaign' },
];

const ControlLabel = styled(FormControlLabel)`
  margin: 0;
  padding: 10px 12px 10px 10px;
  border: 1px solid ${Colors.outline};
  justify-content: center;
  background: ${Colors.white};

  span {
    font-size: 14px;
    line-height: 16px;
    padding: 0;
  }

  .MuiFormControlLabel-label {
    padding: 0 0 0 3px;
  }

  :not(:last-of-type) {
    border-right: none;
  }

  :first-of-type {
    border-radius: 3px 0 0 3px;
  }

  :last-of-type {
    border-radius: 0 3px 3px 0;
  }
`;

const AdministeredCheckbox = styled(Checkbox)`
  .MuiSvgIcon-root path {
    color: ${Colors.safe};
  }
`;

function AdministeredVaccineSchedule(props) {
  return (
    <ControlLabel control={<AdministeredCheckbox checked disabled />} label={props.option.label} />
  );
}

export const ImmunisationForm = React.memo(
  ({
    onCancel,
    onSubmit,
    practitionerSuggester,
    facilitySuggester,
    departmentSuggester,
    getScheduledVaccines,
  }) => {
    const [vaccineOptions, setVaccineOptions] = useState([]);
    const [category, setCategory] = useState();
    const [vaccineLabel, setVaccineLabel] = useState();
    const [administeredOptions, setAdministeredOptions] = useState([]);
    const [scheduleOptions, setScheduleOptions] = useState([]);
    const scheduledVaccinesToOptions = useCallback(
      async category => {
        try {
          setAdministeredOptions([]);
          setScheduleOptions([]);
          const availableScheduledVaccines = await getScheduledVaccines({ category });
          setVaccineOptions(
            availableScheduledVaccines.map(vaccine => ({
              label: vaccine.label,
              value: vaccine.label,
              schedules: vaccine.schedules,
            })),
          );
        } catch (e) {
          setVaccineOptions([]);
        }
      },
      [setVaccineOptions],
    );
    return (
      <Form
        onSubmit={onSubmit}
        initialValues={{
          date: new Date(),
        }}
        render={({ submitForm }) => (
          <FormGrid>
            <Field
              name="category"
              label="Category"
              value={category}
              component={RadioField}
              style={{ gridColumn: '1/-1' }}
              options={VaccineScheduleOptions}
              onChange={e => {
                setCategory(e.target.value);
                scheduledVaccinesToOptions(e.target.value);
              }}
              required
            />
            <div style={{ gridColumn: '1/-1' }}>
              <Field
                name="vaccineLabel"
                label="Vaccine"
                value={vaccineLabel}
                component={SelectField}
                options={vaccineOptions}
                onChange={e => {
                  const label = e.target.value;
                  setVaccineLabel(label);
                  const vaccine = vaccineOptions.find(v => v.label === label);
                  if (vaccine) {
                    setAdministeredOptions(
                      vaccine.schedules
                        .filter(s => s.administered)
                        .map(s => ({
                          value: s.scheduledVaccineId,
                          label: s.schedule,
                        })),
                    );
                    setScheduleOptions(
                      vaccine.schedules
                        .filter(s => !s.administered)
                        .map(s => ({
                          value: s.scheduledVaccineId,
                          label: s.schedule,
                        })),
                    );
                  }
                }}
                required
              />
            </div>

            <div>
              <OuterLabelFieldWrapper label="Administered Schedule" />
              {administeredOptions.map(option => (
                <AdministeredVaccineSchedule option={option} />
              ))}
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <Field
                name="scheduledVaccineId"
                label="Available Schedule"
                inline
                component={RadioField}
                options={scheduleOptions}
                required
              />
            </div>
            <Field name="date" label="Date" component={DateField} required />
            <Field
              name="examinerId"
              label="Given by"
              component={AutocompleteField}
              suggester={practitionerSuggester}
              required
            />
            <Field
              name="locationId"
              label="Health Facility"
              component={AutocompleteField}
              suggester={facilitySuggester}
              required
            />
            <Field
              name="departmentId"
              label="Department"
              required
              component={AutocompleteField}
              suggester={departmentSuggester}
            />
            <Field name="batch" label="Batch" component={TextField} required />
            <ConfirmCancelRow
              onConfirm={submitForm}
              confirmDisabled={scheduleOptions.length == 0}
              onCancel={onCancel}
            />
          </FormGrid>
        )}
      />
    );
  },
);
