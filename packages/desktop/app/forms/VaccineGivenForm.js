import React, { useState } from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { INJECTION_SITE_OPTIONS, VACCINE_CATEGORY_OPTIONS } from 'shared/constants';

import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { TwoTwoGrid } from '../components/TwoTwoGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { AdministeredVaccineSchedule } from '../components/AdministeredVaccineSchedule';
import {
  Form,
  Field,
  TextField,
  AutocompleteField,
  DateField,
  RadioField,
  SelectField,
  CheckField,
  LocalisedLocationField,
} from '../components/Field';
import { useSuggester } from '../api';

const FullWidthCol = styled.div`
  grid-column: 1/-1;
`;

export const VaccineGivenForm = ({
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
}) => {
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const countrySuggester = useSuggester('country');

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: getCurrentDateTimeString(),
      }}
      validationSchema={yup.object().shape({
        scheduledVaccineId: yup.string().required(),
        date: yup.string().required(),
        consent: yup
          .boolean()
          .oneOf([true])
          .required(),
      })}
      render={({ submitForm, values }) => (
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
          <FullWidthCol>
            <Field name="givenOverseas" label="Given overseas" component={CheckField} />
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
          <Field name="batch" label="Batch" component={TextField} />
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
            name="injectionSite"
            label="Injection site"
            component={SelectField}
            options={Object.values(INJECTION_SITE_OPTIONS).map(site => ({
              label: site,
              value: site,
            }))}
          />
          <Field name="locationId" component={LocalisedLocationField} required />
          <Field
            name="departmentId"
            label="Department"
            required
            component={AutocompleteField}
            suggester={departmentSuggester}
          />
          {values.givenOverseas ? (
            <Field
              name="givenByCountryId"
              label="Country"
              component={AutocompleteField}
              suggester={countrySuggester}
              required
            />
          ) : (
            <Field name="givenBy" label="Given by" component={TextField} />
          )}

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
          <FullWidthCol>
            <OuterLabelFieldWrapper label="Consent" style={{ marginBottom: '5px' }} required />
            <Field
              name="consent"
              label={
                values.givenOverseas
                  ? 'Do you have consent to record in Tamanu?'
                  : 'Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?'
              }
              component={CheckField}
              required
            />
          </FullWidthCol>
          <ConfirmCancelRow
            onConfirm={submitForm}
            confirmDisabled={scheduleOptions.length === 0}
            onCancel={onCancel}
          />
        </TwoTwoGrid>
      )}
    />
  );
};

VaccineGivenForm.propTypes = {
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
