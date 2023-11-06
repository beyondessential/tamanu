import React, { ReactElement } from 'react';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { DateField } from '~/ui/components/DateField/DateField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { OptionType, Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView, StyledView } from '~/ui/styled/common';
import { ReferenceDataType } from '~/types';
import { Dropdown } from '~/ui/components/Dropdown';
import { Button } from '~/ui/components/Button';
import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { Form } from '~/ui/components/Forms/Form';
import { useAuth } from '~/ui/contexts/AuthContext';
import { IPatientProgramRegistryForm } from '../../stacks/PatientProgramRegistryForm';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { Routes } from '~/ui/helpers/routes';

export const PatientProgramRegistryForm2 = ({ route }: BaseAppProps) => {
  const navigation = useNavigation();
  const { programRegistry, editedObject } = route.params;
  const { models } = useBackend();
  const practitionerSuggester = new Suggester(
    models.User,
    { column: 'displayName' },
    (model): OptionType => ({ label: model.displayName, value: model.id }),
  );
  const facilitySuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.Facility,
    },
  });
  const submitPatientProgramRegistration = async (formData: IPatientProgramRegistryForm) => {
    console.log(formData);
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
          facilityId: yup.string(),
          clinicianId: yup.string().required('Registered by must be selected'),
          conditions: yup.string(),
        })}
        onSubmit={submitPatientProgramRegistration}
      >
        {({ errors, handleSubmit }): ReactElement => {
          console.log(errors);
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
                  name="facilityId"
                />
              </StyledView>
              <StyledView marginLeft={20} marginRight={20}>
                <LocalisedField
                  localisationPath="fields.status"
                  labelFontSize={14}
                  component={Dropdown}
                  name="clinicalStatusId"
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Removed', value: 'removed' },
                  ]}
                />
              </StyledView>
              <StyledView marginLeft={20} marginRight={20}>
                <LocalisedField
                  localisationPath="fields.conditions"
                  labelFontSize={14}
                  component={AutocompleteModalField}
                  placeholder={`Search`}
                  navigation={navigation}
                  modalRoute={Routes.HomeStack.PatientProgramRegistryFormStack.ConditionMultiselect}
                  name="conditions"
                />
              </StyledView>
              <Button
                buttonText="Confifrm"
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
