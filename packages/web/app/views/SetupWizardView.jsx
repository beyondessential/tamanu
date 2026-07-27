import { Typography } from '@material-ui/core';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import IconButton from '@mui/material/IconButton';
import { useQueryClient } from '@tanstack/react-query';
import { FieldArray } from 'formik';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import {
  Alert,
  Field,
  Form,
  FormGrid,
  FormSubmitButton,
  TextButton,
  TextField,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { useApi } from '../api';
import { BodyText, LogoDark } from '../components';
import { Colors } from '../constants';
import { splashImages } from '../constants/images';
import { getBrandId, notifySuccess } from '../utils';
import { FULL_VERSION } from '../utils/env';

// Dedicated layout rather than AuthFlowView, whose centred body + fixed logo
// don't suit a tall scrolling form: logo in normal flow atop a scrollable column.
const Page = styled.div`
  display: flex;
  height: 100vh;
  background: ${Colors.white};
`;

const FormColumn = styled.div`
  width: 50vw;
  min-width: 500px;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0 48px;
`;

const ColumnInner = styled.div`
  width: 100%;
  max-width: 480px;
  padding: 0 16px;
`;

const FormWrapper = styled(ColumnInner)`
  margin-top: 48px;
`;

const SplashImage = styled.div`
  flex: 1;
  background-image: url(${props => splashImages[props.brandId]});
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center right;
`;

const VersionText = styled(Typography)`
  align-self: flex-end;
  margin: 24px 24px 0 0;
  font-size: 9px;
  color: ${Colors.midText};
`;

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

const isValidUrl = value => {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
};

const validationSchema = yup.object().shape({
  // Validate with the URL parser rather than yup's .url() (which rejects hosts
  // without a TLD, e.g. localhost) to match the server's check.
  host: yup
    .string()
    .trim()
    .required('*Required')
    .test('valid-url', 'Central server URL must be a valid URL', isValidUrl),
  email: yup.string().trim().required('*Required'),
  password: yup.string().required('*Required'),
  facilityIds: yup
    .array()
    .of(yup.string())
    // Attach the error to the first field's path so it renders inline like the others.
    .test('has-one', value =>
      value?.some(id => id?.trim())
        ? true
        : new yup.ValidationError('*Required', value, 'facilityIds.0'),
    ),
});

const cleanFacilityIds = facilityIds => [
  ...new Set(facilityIds.map(id => id.trim()).filter(Boolean)),
];

export const SetupWizardView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
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
      notifySuccess(
        getTranslation('setup.success', 'Server set up successfully. Please log in to continue.'),
      );
      // Refetch the alive/setup status so the app drops into login — no full reload,
      // which would re-run auth refresh and surface a misleading "session expired".
      await queryClient.invalidateQueries(['serverAlive']);
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

  const brandId = getBrandId();

  return (
    <Page>
      <FormColumn>
        <ColumnInner>
          <LogoDark size="140px" />
        </ColumnInner>
        <FormWrapper>
          <Form
            onSubmit={handleSubmit}
            validationSchema={validationSchema}
            initialValues={{
              host: '',
              email: '',
              password: '',
              facilityIds: [''],
            }}
            render={({ values }) => {
              return (
                <FormGrid columns={1}>
                  <div>
                    <Heading>
                      <TranslatedText stringId="setup.heading" fallback="Set up this server" />
                    </Heading>
                    <Subtext>
                      <TranslatedText
                        stringId="setup.subtitle"
                        fallback="Connect this facility server to its central server. You'll need administrator credentials."
                      />
                    </Subtext>
                    {Boolean(errorMessage) && <SetupAlert>{errorMessage}</SetupAlert>}
                  </div>

                  <Field
                    name="host"
                    component={TextField}
                    required
                    label={
                      <TranslatedText stringId="setup.host.label" fallback="Central server URL" />
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
                            {/* The first facility can't be removed — a server always serves at least one. */}
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
                          </FacilityRow>
                        ))}
                        <TextButton
                          onClick={() => push('')}
                          style={{ textTransform: 'none', alignSelf: 'flex-start' }}
                        >
                          <TranslatedText
                            stringId="setup.facilityId.add"
                            fallback="+ Add another facility"
                          />
                        </TextButton>
                      </FormGrid>
                    )}
                  />

                  <FormSubmitButton
                    text={
                      <TranslatedText stringId="setup.submit" fallback="Connect and continue" />
                    }
                  />
                </FormGrid>
              );
            }}
          />
        </FormWrapper>
        <VersionText title={FULL_VERSION}>{FULL_VERSION}</VersionText>
      </FormColumn>
      <SplashImage brandId={brandId} />
    </Page>
  );
};
