import React, { useEffect, useState } from 'react';
import {
  screenPercentageToDP,
  Orientation,
} from '/helpers/screen';
import { theme } from '/styled/theme';
import { Button } from '../Button';
import { useNavigation } from '@react-navigation/native';
import { Suggester, BaseModelSubclass } from '~/ui/helpers/suggester';

interface AutocompleteModalFieldProps {
  value?: string,
  placeholder?: string,
  onChange: (newValue: string) => void,
  suggester: Suggester<BaseModelSubclass>, // Do we make the props a generic type based on the suggester?
  modalRoute: string,
};

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
    if (!value || !suggester) return; // TODO: Understand this
    (async (): Promise<void> => {
      const data = await suggester.fetchCurrentOption(value);
      if (data) setLabel(data.label);
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
