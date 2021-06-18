import React, { useMemo, useCallback, ReactElement } from 'react';
import { Formik } from 'formik';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
import { useBackend } from '~/ui/hooks';
import { withPatient } from '~/ui/containers/Patient';
import {
  Orientation,
  screenPercentageToDP,
} from '/helpers/screen';
import { IPatient, ReferenceDataType } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';
import { Suggester } from '~/ui/helpers/suggester';
import { ID } from '~/types/ID';
import { customAlphabet } from 'nanoid/non-secure';
import { LabRequestForm } from '~/ui/components/Forms/LabRequestForm';

const ALPHABET_FOR_ID = 'ABCDEFGH' + /*I*/ 'JK' + /*L*/ 'MN' + /*O*/ 'PQRSTUVWXYZ' + /*01*/ '23456789';

interface LabRequestFormData {
  displayId: ID,
  requestedDate: Date,
  requestedBy: string,
  urgent: boolean,
  specimenAttached: boolean,
  category: string,
}

const defaultInitialValues = {
  // displayId: '',
  // requestedDate: new Date(),
  requestedBy: '',
  urgent: false,
  specimenAttached: false,
  category: '',
}

interface DumbAddLabRequestScreenProps {
  selectedPatient: IPatient,
  navigation: any,
};

export const DumbAddLabRequestScreen = ({ selectedPatient, navigation }: DumbAddLabRequestScreenProps): ReactElement => {
  const displayId = useMemo(customAlphabet(ALPHABET_FOR_ID, 6), [selectedPatient]);

  const validationSchema = undefined; // TODO:

  const navigateToHistory = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.HomeStack.LabRequestStack.LabRequestTabs.ViewHistory }],
    })
  }, []);

  const user = useSelector(authUserSelector);

  const { models } = useBackend();

  const recordLabRequest = useCallback(
    async (values: LabRequestFormData): Promise<void> => {
      const encounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        user.id,
        { reasonForEncounter: 'lab request from mobile' },
      );

      await models.LabRequest.createWithTests({
        ...values,
        encounter: encounter.id,
        labTestTypeIds: [],
      });

      navigateToHistory();
    }, [],
  );

  const labRequestCategorySuggester = new Suggester(
    models.ReferenceData,
    {
      where: {
        type: ReferenceDataType.LabTestCategory,
      },
    },
  );
  
  const initialValues = {
    ...defaultInitialValues,
    requestedDate: new Date(),
    displayId,
  }

  return (
    <StyledSafeAreaView flex={1}>
      <FullView
        background={theme.colors.BACKGROUND_GREY}
        paddingBottom={screenPercentageToDP(4.86, Orientation.Height)}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={recordLabRequest}
          labRequestCategorySuggester={labRequestCategorySuggester}
          navigation={navigation}
        >
          {LabRequestForm}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const AddLabRequestScreen = compose(withPatient)(DumbAddLabRequestScreen);
