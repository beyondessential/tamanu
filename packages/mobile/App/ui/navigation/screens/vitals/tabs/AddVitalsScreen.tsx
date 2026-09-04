import React, { useState, type ReactElement } from 'react';
import { VitalsForm } from '/components/Forms/VitalsForm';
import { Routes } from '/helpers/routes';
import type { NavigationProp } from '@react-navigation/native';

interface ScreenProps {
  navigation: NavigationProp<any>;
}

export const AddVitalsScreen: React.FC<ScreenProps> = ({ navigation }): ReactElement => {
  // Keying the form on this remounts it after a successful submit so the next
  // visit starts blank, while a plain tab switch keeps in-progress input.
  const [submitCount, setSubmitCount] = useState(0);

  const onAfterSubmit = (): void => {
    setSubmitCount(count => count + 1);
    navigation.navigate(Routes.HomeStack.VitalsStack.VitalsTabs.ViewHistory);
  };

  return <VitalsForm key={submitCount} onAfterSubmit={onAfterSubmit} />;
};
