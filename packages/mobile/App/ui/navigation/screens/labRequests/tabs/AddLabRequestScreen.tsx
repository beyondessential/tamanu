import React, { useMemo, useCallback, ReactElement } from 'react';
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

const ALPHABET_FOR_ID =
  'ABCDEFGH' + /*I*/ 'JK' + /*L*/ 'MN' + /*O*/ 'PQRSTUVWXYZ' + /*01*/ '23456789';

interface LabRequestFormData {
  displayId: ID;
  requestedDate: Date;
  requestedTime: Date;
  requestedBy: string;
  sampleDate: Date;
  sampleTime: Date;
  categoryId: string;
  priorityId: string;
  labSampleSite: string;
  labTestTypes: string[];
}

const validationSchema = Yup.object().shape({
  displayId: Yup.string().required(),
  requestedDate: Yup.date().required(),
  sampleDate: Yup.date().required(),
  sampleTime: Yup.date().required(),
  categoryId: Yup.string().required('Required'),
  requestedBy: Yup.string().required('Required'),
  priorityId: Yup.string(),
});

interface DumbAddLabRequestScreenProps {
  selectedPatient: IPatient;
  navigation: any;
}

export const DumbAddLabRequestScreen = ({
  selectedPatient,
  navigation,
}: DumbAddLabRequestScreenProps): ReactElement => {
  const displayId = useMemo(customAlphabet(ALPHABET_FOR_ID, 7), [selectedPatient]);

  const navigateToHistory = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.HomeStack.LabRequestStack.LabRequestTabs.ViewHistory }],
    });
  }, []);

  const user = useSelector(authUserSelector);

  const { models } = useBackend();

  const validate = useCallback(values => {
    const { categoryId, labTestTypes = [] } = values;

    if (categoryId) {
      if (!labTestTypes || labTestTypes.length === 0) {
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
      labSampleSite,
      requestedBy,
      displayId: generatedDisplayId,
    } = values;

    // Convert requestedDate and sampleTime to strings
    const requestedDateString = getCombinedDateString(requestedDate, requestedTime);
    const sampleTimeString = getCombinedDateString(sampleDate, sampleTime);

    await models.LabRequest.createWithTests({
      displayId: generatedDisplayId,
      requestedDate: requestedDateString,
      requestedBy,
      encounter: encounter.id,
      labTestCategory: values.categoryId,
      labTestPriority: values.priorityId,
      sampleTime: sampleTimeString,
      labTestTypeIds: values.labTestTypes,
      labSampleSite,
    });

    navigateToHistory();
  }, []);

  const initialValues = {
    sampleTime: new Date(),
    sampleDate: new Date(),
    requestedDate: new Date(),
    requestedTime: new Date(),
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
          validationSchema={validationSchema}
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
