import React, { ReactElement, useCallback, FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import { Route } from 'react-native-tab-view';
import { SvgProps } from 'react-native-svg';
import { FullView, StyledView, StyledSafeAreaView, RowView } from '../../../../styled/common';
import {
  VaccineForm, SubmitButtonsProps,
} from '../../../../components/Forms/VaccineForms';
import { theme } from '../../../../styled/theme';
import { SectionHeader } from '../../../../components/SectionHeader';
import { Button } from '../../../../components/Button';
import { VaccineDataProps } from '../../../../components/VaccineCard';


const SubmitButtons = ({ onSubmit, onCancel }: SubmitButtonsProps): ReactElement => (
  <RowView
    paddingTop={20}
    flex={1}
    alignItems="flex-end"
    justifyContent="center"
    paddingBottom={20}
  >
    <RowView flex={1} height={50}>
      <Button
        flex={1}
        marginRight={10}
        onPress={onCancel}
        outline
        borderColor={theme.colors.PRIMARY_MAIN}
        buttonText="Cancel"
      />
      <Button
        flex={1}
        onPress={onSubmit}
        backgroundColor={theme.colors.PRIMARY_MAIN}
        buttonText="Submit"
      />
    </RowView>
  </RowView>
);


type NewVaccineTabProps = {
  route: Route & {
    icon: FC<SvgProps>;
    color?: string;
    vaccine: VaccineDataProps
  }
};


export const NewVaccineTab = ({ route }: NewVaccineTabProps): ReactElement => {
  const { vaccine } = route;
  const navigation = useNavigation();

  const onPressCancel = useCallback(
    () => {
      navigation.goBack();
    },
    [],
  );

  const onFormSubmit = useCallback(
    (values) => console.log(values),
    [],
  );

  console.log(vaccine);
  return (
    <FullView>
      <StyledSafeAreaView
        flex={1}
        paddingTop={20}
        paddingRight={20}
        paddingLeft={20}
      >
        <ScrollView
          contentContainerStyle={{
            flex: 1,
          }}
        >
          <StyledView marginBottom={5}>
            <SectionHeader h3>INFORMATION</SectionHeader>
          </StyledView>
          <VaccineForm
            onSubmit={onFormSubmit}
            onCancel={onPressCancel}
            SubmitButtons={SubmitButtons}
            initialValues={vaccine}
            type={route.key}
          />
        </ScrollView>
      </StyledSafeAreaView>
    </FullView>
  );
};
