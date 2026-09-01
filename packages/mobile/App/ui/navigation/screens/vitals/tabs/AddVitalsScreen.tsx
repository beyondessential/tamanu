import React, { ReactElement, useState } from 'react';
import { VitalsForm } from '/components/Forms/VitalsForm';
import { Routes } from '/helpers/routes';
import { NavigationProp } from '@react-navigation/native';

interface ScreenProps {
  navigation: NavigationProp<any>;
}

export const AddVitalsScreen: React.FC<ScreenProps> = ({ navigation }): ReactElement => {
  // Bumping this counter after a successful submit does two things: its `key`
  // remounts the form so the next visit starts blank (without clearing
  // in-progress input on a plain tab switch), and passing it to the History tab
  // as a param makes that tab refetch to show the newly added vital.
  const [submitCount, setSubmitCount] = useState(0);

  const onAfterSubmit = (): void => {
    const nextSubmitCount = submitCount + 1;
    setSubmitCount(nextSubmitCount);
    navigation.navigate(Routes.HomeStack.VitalsStack.VitalsTabs.ViewHistory, {
      refreshToken: nextSubmitCount,
    });
  };

  return <VitalsForm key={submitCount} onAfterSubmit={onAfterSubmit} />;
};
