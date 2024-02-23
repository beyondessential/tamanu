import React, { ReactElement } from 'react';
import * as yup from 'yup';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { DateField } from '~/ui/components/DateField/DateField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { OptionType, Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView, StyledView } from '~/ui/styled/common';
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

export const PatientProgramRegistrationDetailsForm = ({ navigation, route }: BaseAppProps) => {
  const { programRegistry, editedObject, selectedPatient } = route.params;
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
          programRegistry: programRegistry.id,
        },
      }),
    [],
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

    for (const condition of formData.conditions) {
      await PatientProgramRegistrationCondition.createAndSaveOne({
        date: formData.date,
        programRegistry: programRegistry.id,
        patient: selectedPatient.id,
        programRegistryCondition: condition.value,
        clinician: formData.clinicianId,
      });
    }

    navigation.navigate(Routes.HomeStack.PatientProgramRegistrationDetailsStack.Index, {
      patientProgramRegistration: newPpr,
    });
  };
  const { user } = useAuth();
  return (
    <FullView>
      <EmptyStackHeader
        title={programRegistry.name}
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
          clinicianId: yup.string().required('Registered by must be selected'),
          conditions: yup.string(),
        })}
        onSubmit={submitPatientProgramRegistration}
      >
        {({ errors, handleSubmit, values }): ReactElement => {
          return (
            <>
              <StyledView marginTop={20} marginLeft={20} marginRight={20}>
                <LocalisedField
                  localisationPath="fields.date"
                  labelFontSize={14}
                  component={DateField}
                  min={new Date()}
                  name="date"
                />
              </StyledView>
              <StyledView marginLeft={20} marginRight={20}>
                <LocalisedField
                  localisationPath="fields.registeredBy"
                  labelFontSize={14}
                  component={AutocompleteModalField}
                  placeholder={`Search`}
                  navigation={navigation}
                  suggester={practitionerSuggester}
                  name="clinicianId"
                />
              </StyledView>
              <StyledView marginLeft={20} marginRight={20}>
                <LocalisedField
                  localisationPath="fields.facility"
                  labelFontSize={14}
                  component={AutocompleteModalField}
                  placeholder={`Search`}
                  navigation={navigation}
                  suggester={facilitySuggester}
                  name="registeringFacilityId"
                />
              </StyledView>
              <StyledView marginLeft={20} marginRight={20}>
                <LocalisedField
                  localisationPath="fields.status"
                  labelFontSize={14}
                  component={Dropdown}
                  name="clinicalStatusId"
                  options={clinicalStatusOptions?.map(x => ({ label: x.name, value: x.id })) || []}
                />
              </StyledView>
              <StyledView marginLeft={20} marginRight={20}>
                <LocalisedField
                  localisationPath="fields.conditions"
                  labelFontSize={14}
                  component={MultiSelectModalField}
                  modalTitle="Conditions"
                  suggester={conditionSuggester}
                  placeholder={`Search`}
                  navigation={navigation}
                  name="conditions"
                  value={values.conditions}
                  searchPlaceholder="Search conditions..."
                />
              </StyledView>
              <Button
                buttonText="Confirm"
                backgroundColor={theme.colors.PRIMARY_MAIN}
                marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
                marginRight={screenPercentageToDP(7, Orientation.Width)}
                onPress={handleSubmit}
              />
            </>
          );
        }}
      </Form>
    </FullView>
  );
};
