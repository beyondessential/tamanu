import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { FieldArray } from 'formik';
import { Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import IconButton from '@mui/material/IconButton';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { Form, FormGrid, TextField, FormSubmitButton, TextButton } from '@tamanu/ui-components';

import { Field, RadioField, BodyText } from '../components';
import { Colors } from '../constants';
import { AuthFlowView } from './AuthFlowView';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { useApi } from '../api';

const Heading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 24px;
  line-height: 28px;
`;

const Subtext = styled(BodyText)`
  color: ${Colors.midText};
  padding-top: 8px;
  font-size: 14px;
`;

const SetupAlert = styled(Alert).attrs({ severity: 'error', icon: false })`
  border-radius: 0.5em;
  margin-top: 1em;
  white-space: pre-line;
`;

const FacilityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Fixed-width slot so every facility-id input stays the same width whether or
// not its row has a remove button.
const RemoveSlot = styled.div`
  width: 36px;
  flex-shrink: 0;
`;

// AuthFlowView vertically centres its content; this form can be taller than the
// viewport (omniserver, many facilities), so bound it and scroll internally
// rather than letting the top/bottom clip off screen. The top padding keeps the
// heading clear of the fixed Tamanu logo (top-left) when the form fills the
// height — login doesn't hit this because its short form centres lower down.
const ScrollArea = styled.div`
  width: 100%;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 120px 8px 24px;
`;

const SUPPORTED_MODES = { SINGLE: 'single', MULTIPLE: 'multiple' };

const validationSchema = yup.object().shape({
  host: yup
    .string()
    .trim()
    .url()
    .required(),
  email: yup
    .string()
    .trim()
    .required(),
  password: yup.string().required(),
  facilityIds: yup
    .array()
    .of(yup.string())
    .test('has-one', '', value => Boolean(value?.some(id => id?.trim()))),
});

const cleanFacilityIds = facilityIds => [
  ...new Set(facilityIds.map(id => id.trim()).filter(Boolean)),
];

export const SetupWizardView = () => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async values => {
    setErrorMessage(null);
    try {
      await api.post(
        'public/setup/sync',
        {
          host: values.host.trim(),
          email: values.email.trim(),
          password: values.password,
          facilityIds: cleanFacilityIds(values.facilityIds),
        },
        { useAuthToken: false, waitForAuth: false, showUnknownErrorToast: false },
      );
      // Re-query setup status and drop into the normal login flow.
      window.location.reload();
    } catch (error) {
      setErrorMessage(
        error?.message ??
          getTranslation(
            'setup.error.generic',
            'Could not complete setup. Check the details and try again.',
          ),
      );
    }
  };

  return (
    <AuthFlowView>
      <Form
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        initialValues={{
          host: '',
          email: '',
          password: '',
          mode: SUPPORTED_MODES.SINGLE,
          facilityIds: [''],
        }}
        render={({ values, setFieldValue }) => {
          const isMultiple = values.mode === SUPPORTED_MODES.MULTIPLE;
          return (
            <ScrollArea>
            <FormGrid columns={1}>
              <div>
                <Heading>
                  <TranslatedText stringId="setup.heading" fallback="Set up this server" />
                </Heading>
                <Subtext>
                  <TranslatedText
                    stringId="setup.subtitle"
                    fallback="Connect this facility server to its central sync server. You'll need central server administrator credentials."
                  />
                </Subtext>
                {Boolean(errorMessage) && <SetupAlert>{errorMessage}</SetupAlert>}
              </div>

              <Field
                name="host"
                component={TextField}
                required
                label={
                  <TranslatedText stringId="setup.host.label" fallback="Sync server URL" />
                }
                placeholder={getTranslation(
                  'setup.host.placeholder',
                  'https://central.example.com',
                )}
                autoComplete="off"
                enablePasting
              />

              <Field
                name="email"
                component={TextField}
                required
                label={
                  <TranslatedText
                    stringId="setup.email.label"
                    fallback="Administrator username"
                  />
                }
                placeholder={getTranslation(
                  'setup.email.placeholder',
                  'Enter the central administrator username',
                )}
                autoComplete="off"
                enablePasting
              />

              <Field
                name="password"
                component={TextField}
                type="password"
                required
                label={
                  <TranslatedText
                    stringId="setup.password.label"
                    fallback="Administrator password"
                  />
                }
                autoComplete="off"
              />

              <Field
                name="mode"
                component={RadioField}
                fullWidth
                label={<TranslatedText stringId="setup.mode.label" fallback="Facilities" />}
                options={[
                  {
                    value: SUPPORTED_MODES.SINGLE,
                    label: getTranslation('setup.mode.single', 'Single facility'),
                  },
                  {
                    value: SUPPORTED_MODES.MULTIPLE,
                    label: getTranslation('setup.mode.multiple', 'Multiple facilities (omniserver)'),
                  },
                ]}
                onChange={event => {
                  // Single mode collapses to exactly one id; keep the first entry.
                  if (event.target.value === SUPPORTED_MODES.SINGLE) {
                    setFieldValue('facilityIds', [values.facilityIds[0] ?? '']);
                  }
                }}
              />

              <FieldArray
                name="facilityIds"
                render={({ push, remove }) => (
                  <FormGrid columns={1}>
                    {values.facilityIds.map((_, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <FacilityRow key={index}>
                        <Field
                          name={`facilityIds.${index}`}
                          component={TextField}
                          label={
                            index === 0 ? (
                              <TranslatedText
                                stringId="setup.facilityId.label"
                                fallback="Facility ID"
                              />
                            ) : null
                          }
                          placeholder={getTranslation(
                            'setup.facilityId.placeholder',
                            'e.g. facility-a',
                          )}
                          autoComplete="off"
                          enablePasting
                          style={{ flex: 1 }}
                        />
                        {isMultiple && (
                          <RemoveSlot>
                            {index > 0 && (
                              <IconButton
                                size="small"
                                onClick={() => remove(index)}
                                aria-label={getTranslation('general.action.remove', 'Remove')}
                              >
                                <RemoveCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            )}
                          </RemoveSlot>
                        )}
                      </FacilityRow>
                    ))}
                    {isMultiple && (
                      <TextButton
                        onClick={() => push('')}
                        style={{ textTransform: 'none', alignSelf: 'flex-start' }}
                      >
                        <TranslatedText
                          stringId="setup.facilityId.add"
                          fallback="+ Add another facility"
                        />
                      </TextButton>
                    )}
                  </FormGrid>
                )}
              />

              <FormSubmitButton
                text={<TranslatedText stringId="setup.submit" fallback="Connect and continue" />}
              />
            </FormGrid>
            </ScrollArea>
          );
        }}
      />
    </AuthFlowView>
  );
};
