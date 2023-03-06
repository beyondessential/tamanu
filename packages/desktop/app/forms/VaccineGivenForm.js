import React from 'react';
import styled from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';
import * as yup from 'yup';

import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { INJECTION_SITE_OPTIONS, VACCINE_CATEGORY_OPTIONS } from 'shared/constants';

import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { ControlLabel } from '../components/ControlLabel';
import { TwoTwoGrid } from '../components/TwoTwoGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
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
import { Colors } from '../constants';
import { useSuggester } from '../api';

const AdministeredCheckbox = styled(Checkbox)`
  .MuiSvgIcon-root path {
    color: ${Colors.safe};
  }
`;

const FullWidthCol = styled.div`
  grid-column: 1/-1;
`;

const AdministeredVaccineSchedule = ({ option }) => (
  <ControlLabel control={<AdministeredCheckbox checked disabled />} label={option.label} />
);

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

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: getCurrentDateTimeString(),
      }}
      validationSchema={yup.object().shape({
        consent: yup
          .boolean()
          .oneOf([true])
          .required(),
      })}
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
          <Field name="givenBy" label="Given by" component={TextField} />
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
              label="Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?"
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
