import React from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';

import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { VACCINE_CATEGORY_OPTIONS } from 'shared/constants';

import { TwoTwoGrid } from '../components/TwoTwoGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { AdministeredVaccineSchedule } from '../components/AdministeredVaccineSchedule';

import {
  Form,
  Field,
  TextField,
  DateField,
  RadioField,
  SelectField,
  SuggesterSelectField,
} from '../components/Field';

const FullWidthCol = styled.div`
  grid-column: 1/-1;
`;

export const VaccineNotGivenForm = ({
  vaccineLabel,
  vaccineOptions,
  administeredOptions,
  onSubmit,
  category,
  scheduleOptions,
  onCancel,
  setCategory,
  setVaccineLabel,
  currentUser,
}) => (
  <Form
    onSubmit={onSubmit}
    initialValues={{
      date: getCurrentDateTimeString(),
    }}
    render={({ submitForm }) => (
      <TwoTwoGrid>
        <FullWidthCol>
          <Field
            name="category"
            label="Category"
            value={category}
            component={RadioField}
            options={VACCINE_CATEGORY_OPTIONS}
            onChange={e => {
              setCategory(e.target.value);
              setVaccineLabel(null);
            }}
            required
          />
        </FullWidthCol>
        <Field
          name="vaccineLabel"
          label="Vaccine"
          value={vaccineLabel}
          component={SelectField}
          options={vaccineOptions}
          onChange={e => setVaccineLabel(e.target.value)}
          required
        />
        {administeredOptions.length || scheduleOptions.length ? (
          <FullWidthCol>
            {administeredOptions.length > 0 && (
              <div>
                <OuterLabelFieldWrapper label="Administered schedule" />
                {administeredOptions.map(option => (
                  <AdministeredVaccineSchedule option={option} />
                ))}
              </div>
            )}
            {scheduleOptions.length > 0 && (
              <Field
                name="scheduledVaccineId"
                label="Available schedule"
                component={RadioField}
                options={scheduleOptions}
                required
              />
            )}
          </FullWidthCol>
        ) : null}
        <Field name="date" label="Date" component={DateField} required saveDateAsString />
        <Field
          name="notGivenReasonId"
          label="Reason"
          component={SuggesterSelectField}
          endpoint="vaccineNotGivenReason"
        />
        <Field name="supervisingClinician" label="Supervising clinician" component={TextField} />
        <Field
          disabled
          name="recorderId"
          label="Recorded By"
          component={SelectField}
          options={[
            {
              label: currentUser.displayName,
              value: currentUser.id,
            },
          ]}
          value={currentUser.id}
        />
        <ConfirmCancelRow
          onConfirm={submitForm}
          confirmDisabled={scheduleOptions.length === 0}
          onCancel={onCancel}
        />
      </TwoTwoGrid>
    )}
  />
);

VaccineNotGivenForm.propTypes = {
  vaccineLabel: PropTypes.string.isRequired,
  vaccineOptions: PropTypes.array.isRequired,
  administeredOptions: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  scheduleOptions: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  setCategory: PropTypes.func.isRequired,
  setVaccineLabel: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
};
