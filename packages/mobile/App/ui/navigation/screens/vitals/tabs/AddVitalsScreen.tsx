import React, { ReactElement } from 'react';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { VitalsForm } from '/components/Forms/VitalsForm';
import { Routes } from '/helpers/routes';
import { FullView } from '/styled/common';
import { NavigationProp } from '@react-navigation/native';

interface ScreenProps {
  navigation: NavigationProp<any>;
}

export const AddVitalsScreen: React.FC<ScreenProps> = ({ navigation }): ReactElement => {
  const onAfterSubmit = (): void => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.HomeStack.VitalsStack.VitalsTabs.ViewHistory }],
    });
  };

  return (
    <FormScreenView>
      <FullView>
        <VitalsForm onAfterSubmit={onAfterSubmit} />
      </FullView>
    </FormScreenView>
  );
};
