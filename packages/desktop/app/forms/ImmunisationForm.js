import React, { useMemo, useEffect, useState } from 'react';
import styled from 'styled-components';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import { INJECTION_SITE_OPTIONS } from 'shared/constants';
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
  { value: 'Catchup', label: 'Catch-up' },
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

const findVaccinesByAdministeredStatus = (vaccine, administered) =>
  vaccine
    ? vaccine.schedules
      .filter(s => s.administered === administered)
      .map(s => ({
        value: s.scheduledVaccineId,
        label: s.schedule,
      }))
    : [];

export const ImmunisationForm = React.memo(
  ({
    onCancel,
    onSubmit,
    practitionerSuggester,
    departmentSuggester,
    getScheduledVaccines,
    locationSuggester,
  }) => {
    const [vaccineOptions, setVaccineOptions] = useState([]);
    const [category, setCategory] = useState();
    const [vaccineLabel, setVaccineLabel] = useState();

    const selectedVaccine = useMemo(() => vaccineOptions.find(v => v.label === vaccineLabel), [
      vaccineLabel,
      vaccineOptions,
    ]);

    const administeredOptions = useMemo(
      () => findVaccinesByAdministeredStatus(selectedVaccine, true),
      [selectedVaccine],
    );
    const scheduleOptions = useMemo(
      () => findVaccinesByAdministeredStatus(selectedVaccine, false),
      [selectedVaccine],
    );

    useEffect(() => {
      const fetchScheduledVaccines = async () => {
        const availableScheduledVaccines = await getScheduledVaccines({ category });
        setVaccineOptions(
          availableScheduledVaccines.map(vaccine => ({
            label: vaccine.label,
            value: vaccine.label,
            schedules: vaccine.schedules,
          })),
        );
      };

      fetchScheduledVaccines();
    }, [category]);

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
                setVaccineLabel(null);
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
                onChange={e => setVaccineLabel(e.target.value)}
                required
              />
            </div>

            <div>
              <OuterLabelFieldWrapper label="Administered schedule" />
              {administeredOptions.map(option => (
                <AdministeredVaccineSchedule option={option} />
              ))}
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <Field
                name="scheduledVaccineId"
                label="Available schedule"
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
              label="Location"
              component={AutocompleteField}
              suggester={locationSuggester}
              required
            />
            <Field
              name="injectionSite"
              label="Injection site"
              component={SelectField}
              options={Object.values(INJECTION_SITE_OPTIONS).map(site => ({
                label: site,
                value: site,
              }))}
            />
            <Field
              name="departmentId"
              label="Department"
              required
              component={AutocompleteField}
              suggester={departmentSuggester}
            />
            <Field name="batch" label="Batch" component={TextField} />
            <ConfirmCancelRow
              onConfirm={submitForm}
              confirmDisabled={scheduleOptions.length === 0}
              onCancel={onCancel}
            />
          </FormGrid>
        )}
      />
    );
  },
);
