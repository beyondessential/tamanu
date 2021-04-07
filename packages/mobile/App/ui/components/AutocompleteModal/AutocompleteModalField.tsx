import React, { useEffect, useState } from 'react';
import {
  screenPercentageToDP,
  Orientation,
} from '/helpers/screen';
import { theme } from '/styled/theme';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../Button';
import { Suggester, BaseModelSubclass } from '~/ui/helpers/suggester';

interface AutocompleteModalFieldProps {
  value?: string;
  placeholder?: string;
  onChange: (newValue: string) => void;
  suggester: Suggester<BaseModelSubclass>;
  modalRoute: string;
}

export const AutocompleteModalField = ({
  value,
  placeholder,
  onChange,
  suggester,
  modalRoute,
}: AutocompleteModalFieldProps): JSX.Element => {
  const navigation = useNavigation();
  const [label, setLabel] = useState(placeholder);
  const onPress = (selectedItem): void => {
    onChange(selectedItem.value);
    setLabel(selectedItem.label);
  };

  const openModal = (): void => navigation.navigate(modalRoute, {
    callback: onPress,
    suggester,
  });

  useEffect(() => {
    if (!suggester) return;
    (async (): Promise<void> => {
      const data = await suggester.fetchCurrentOption(value);
      if (data) setLabel(data.label);
      else setLabel(placeholder);
    })();
  }, [value]);

  return (
    <Button
      marginTop={screenPercentageToDP(1.22, Orientation.Height)}
      backgroundColor={theme.colors.WHITE}
      textColor="#888888"
      buttonText={label}
      justifyContent="flex-start"
      borderRadius={1}
      borderStyle="solid"
      borderColor="#EBEBEB"
      borderWidth={1}
      fontWeight={400}
      fontSize={15}
      padding={10}
      onPress={openModal}
    />
  );
};
