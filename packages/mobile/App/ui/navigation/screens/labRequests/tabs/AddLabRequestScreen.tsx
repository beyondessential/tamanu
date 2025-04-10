import React, { ReactElement, useCallback } from 'react';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
import { customAlphabet } from 'nanoid/non-secure';
import { useBackend } from '~/ui/hooks';
import { withPatient } from '~/ui/containers/Patient';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { IPatient } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';
import { ID } from '~/types/ID';
import { LabRequestForm } from '~/ui/components/Forms/LabRequestForm';
import { getCombinedDateString } from '/helpers/date';
import { useTranslation } from '~/ui/contexts/TranslationContext';

const ALPHABET_FOR_ID =
  'ABCDEFGH' + /*I*/ 'JK' + /*L*/ 'MN' + /*O*/ 'PQRSTUVWXYZ' + /*01*/ '23456789';

const ALPHABET_GENERATOR = customAlphabet(ALPHABET_FOR_ID, 7);
const generateDisplayId = () => {
  return ALPHABET_GENERATOR();
};

interface LabRequestFormData {
  displayId: ID;
  requestedDate: Date;
  requestedTime: Date;
  requestedById: string;
  sampleDate: Date;
  sampleTime: Date;
  specimenTypeId: string;
  collectedById: string;
  categoryId: string;
  priorityId: string;
  labSampleSiteId: string;
  labTestTypeIds: string[];
}

interface DumbAddLabRequestScreenProps {
  selectedPatient: IPatient;
  navigation: any;
}

export const DumbAddLabRequestScreen = ({
  selectedPatient,
  navigation,
}: DumbAddLabRequestScreenProps): ReactElement => {
  const { getTranslation } = useTranslation();
  const displayId = generateDisplayId();

  const navigateToHistory = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.HomeStack.LabRequestStack.LabRequestTabs.ViewHistory }],
    });
  }, [navigation]);

  const user = useSelector(authUserSelector);

  const { models } = useBackend();

  const validate = useCallback(values => {
    const { categoryId, labTestTypeIds = [] } = values;

    if (categoryId) {
      if (!labTestTypeIds || labTestTypeIds.length === 0) {
        return {
          form: 'At least one lab test type must be selected',
        };
      }
    }

    return {};
  }, []);

  const recordLabRequest = useCallback(async (values: LabRequestFormData): Promise<void> => {
    showMessage({
      message: 'Submitting lab request',
      type: 'default',
      backgroundColor: theme.colors.BRIGHT_BLUE,
    });

    const encounter = await models.Encounter.getOrCreateCurrentEncounter(
      selectedPatient.id,
      user.id,
      { reasonForEncounter: 'Lab request from mobile' },
    );

    const {
      requestedDate,
      requestedTime,
      sampleDate,
      sampleTime,
      labSampleSiteId,
      requestedById,
      collectedById,
      specimenTypeId,
      labTestTypeIds,
      displayId: generatedDisplayId,
    } = values;

    // Convert requestedDate and sampleTime to strings
    const requestedDateString = getCombinedDateString(requestedDate, requestedTime);
    const sampleTimeString = getCombinedDateString(sampleDate, sampleTime);
    await models.LabRequest.createWithTests({
      displayId: generatedDisplayId,
      requestedDate: requestedDateString,
      requestedBy: requestedById,
      encounter: encounter.id,
      labTestCategory: values.categoryId,
      labTestPriority: values.priorityId,
      sampleTime: sampleTimeString,
      labTestTypeIds,
      labSampleSite: labSampleSiteId,
      collectedBy: collectedById,
      specimenType: specimenTypeId,
    });
    navigateToHistory();
  }, [models, user.id, selectedPatient.id, navigateToHistory]);

  const initialValues = {
    sampleTime: new Date(),
    sampleDate: new Date(),
    requestedDate: new Date(),
    requestedTime: new Date(),
    requestedById: user.id,
    displayId,
  };

  return (
    <StyledSafeAreaView flex={1}>
      <FlashMessage position="top" />
      <FullView
        background={theme.colors.BACKGROUND_GREY}
        paddingBottom={screenPercentageToDP(4.86, Orientation.Height)}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={Yup.object().shape({
            displayId: Yup.string().required(
              getTranslation('validation.required.inline', '*Required'),
            ),
            requestedDate: Yup.date().required(
              getTranslation('validation.required.inline', '*Required'),
            ),
            sampleDate: Yup.date().required(
              getTranslation('validation.required.inline', '*Required'),
            ),
            sampleTime: Yup.date().required(
              getTranslation('validation.required.inline', '*Required'),
            ),
            categoryId: Yup.string().required(
              getTranslation('validation.required.inline', '*Required'),
            ),
            requestedById: Yup.string().required(
              getTranslation('validation.required.inline', '*Required'),
            ),
            priorityId: Yup.string(),
          })}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={recordLabRequest}
          navigation={navigation}
          validate={validate}
        >
          {LabRequestForm}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const AddLabRequestScreen = compose(withPatient)(DumbAddLabRequestScreen);
