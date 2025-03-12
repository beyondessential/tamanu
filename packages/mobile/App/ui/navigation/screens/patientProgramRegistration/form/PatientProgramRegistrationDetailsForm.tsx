import React, { ReactElement } from 'react';
import * as yup from 'yup';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { DateField } from '~/ui/components/DateField/DateField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { OptionType, Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView, StyledScrollView, StyledView } from '~/ui/styled/common';
import { Dropdown } from '~/ui/components/Dropdown';
import { Button } from '~/ui/components/Button';
import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { Form } from '~/ui/components/Forms/Form';
import { useAuth } from '~/ui/contexts/AuthContext';
import { IPatientProgramRegistryForm } from '../../../stacks/PatientProgramRegistryForm';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { MultiSelectModalField } from '~/ui/components/MultiSelectModal/MultiSelectModalField';
import { VisibilityStatus } from '~/visibilityStatuses';
import { PatientProgramRegistration } from '~/models/PatientProgramRegistration';
import { useBackendEffect } from '~/ui/hooks/index';
import { PatientProgramRegistrationCondition } from '~/models/PatientProgramRegistrationCondition';
import { Routes } from '~/ui/helpers/routes';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { useTranslation } from '~/ui/contexts/TranslationContext';

export const PatientProgramRegistrationDetailsForm = ({ navigation, route }: BaseAppProps) => {
  const { programRegistry, editedObject, selectedPatient } = route.params;
  const { getTranslation } = useTranslation();
  const { models } = useBackend();
  const practitionerSuggester = new Suggester(
    models.User,
    { column: 'displayName' },
    (model): OptionType => ({ label: model.displayName, value: model.id }),
  );
  const facilitySuggester = new Suggester(models.Facility, {
    where: {
      visibilityStatus: VisibilityStatus.Current,
    },
  });
  const conditionSuggester = new Suggester(models.ProgramRegistryCondition, {
    where: {
      programRegistry: programRegistry.id,
    },
  });

  const [clinicalStatusOptions] = useBackendEffect(
    async ({ models }) =>
      await models.ProgramRegistryClinicalStatus.find({
        where: {
          visibilityStatus: VisibilityStatus.Current,
          programRegistry: { id: programRegistry.id },
        },
      }),
    [programRegistry.id],
  );
  const submitPatientProgramRegistration = async (formData: IPatientProgramRegistryForm) => {
    const newPpr: any = await PatientProgramRegistration.appendRegistration(
      selectedPatient.id,
      programRegistry.id,
      {
        date: formData.date,
        clinicalStatus: formData.clinicalStatusId,
        registeringFacility: formData.registeringFacilityId,
        clinician: formData.clinicianId,
      },
    );

    if (formData.conditions) {
      for (const condition of formData.conditions) {
        await PatientProgramRegistrationCondition.createAndSaveOne({
          date: formData.date,
          programRegistry: programRegistry.id,
          patient: selectedPatient.id,
          programRegistryCondition: condition.value,
          clinician: formData.clinicianId,
        });
      }
    }

    navigation.navigate(Routes.HomeStack.PatientProgramRegistrationDetailsStack.Index, {
      patientProgramRegistration: newPpr,
    });
  };
  const { user } = useAuth();
  return (
    <FullView>
      <StyledScrollView>
        <EmptyStackHeader
          title={
            <TranslatedReferenceData
              fallback={programRegistry.name}
              value={programRegistry.id}
              category="programRegistry"
            />
          }
          onGoBack={() => {
            navigation.goBack();
          }}
        />
        <Form
          initialValues={{
            date: getCurrentDateTimeString(),
            clinicianId: user.id,
            ...editedObject,
          }}
          validationSchema={yup.object().shape({
            // programRegistryId: yup.string().required('Program Registry must be selected'),
            clinicalStatusId: yup.string(),
            date: yup.date(),
            registeringFacilityId: yup.string(),
            clinicianId: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="patientProgramRegistry.registeredBy.label"
                  fallback="Registered by"
                />,
              ),
            conditions: yup.string(),
          })}
          onSubmit={submitPatientProgramRegistration}
        >
          {({ handleSubmit, values }): ReactElement => {
            return (
              <>
                <StyledView marginTop={20} marginLeft={20} marginRight={20}>
                  <LocalisedField
                    label={
                      <TranslatedText
                        stringId="patientProgramRegistry.date.label"
                        fallback="Date of registration"
                      />
                    }
                    labelFontSize={14}
                    component={DateField}
                    min={new Date()}
                    name="date"
                  />
                </StyledView>
                <StyledView marginLeft={20} marginRight={20}>
                  <LocalisedField
                    label={
                      <TranslatedText
                        stringId="patientProgramRegistry.registeredBy.label"
                        fallback="Registered by"
                      />
                    }
                    labelFontSize={14}
                    component={AutocompleteModalField}
                    placeholder={getTranslation('general.placeholder.search', 'Search')}
                    navigation={navigation}
                    suggester={practitionerSuggester}
                    name="clinicianId"
                  />
                </StyledView>
                <StyledView marginLeft={20} marginRight={20}>
                  <LocalisedField
                    label={
                      <TranslatedText
                        stringId="patientProgramRegistry.registeringFacility.label"
                        fallback="Registering facility"
                      />
                    }
                    labelFontSize={14}
                    component={AutocompleteModalField}
                    placeholder={getTranslation('general.placeholder.search', 'Search')}
                    navigation={navigation}
                    suggester={facilitySuggester}
                    name="registeringFacilityId"
                  />
                </StyledView>
                <StyledView marginLeft={20} marginRight={20}>
                  <LocalisedField
                    label={<TranslatedText stringId="general.status.label" fallback="Status" />/* double check this stringId as it's actually clinical status and NOT registry status */}
                    labelFontSize={14}
                    component={Dropdown}
                    name="clinicalStatusId"
                    options={
                      clinicalStatusOptions?.map((x) => ({ label: x.name, value: x.id })) || [] // TBD
                    }
                  />
                </StyledView>
                <StyledView marginLeft={20} marginRight={20}>
                  <LocalisedField
                    label={
                      <TranslatedText
                        stringId="patientProgramRegistry.relatedConditions.label"
                        fallback="Related conditions"
                      />
                    }
                    labelFontSize={14}
                    component={MultiSelectModalField}
                    modalTitle="Conditions"
                    suggester={conditionSuggester}
                    placeholder={getTranslation('general.placeholder.search', 'Search')}
                    navigation={navigation}
                    name="conditions"
                    value={values.conditions}
                    searchPlaceholder={getTranslation('TBD', 'Search conditions...')}
                  />
                </StyledView>
                <Button
                  buttonText={
                    <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                  }
                  backgroundColor={theme.colors.PRIMARY_MAIN}
                  marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
                  marginRight={screenPercentageToDP(7, Orientation.Width)}
                  marginBottom={screenPercentageToDP(2, Orientation.Height)}
                  onPress={handleSubmit}
                />
              </>
            );
          }}
        </Form>
      </StyledScrollView>
    </FullView>
  );
};
