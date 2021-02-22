import React, { useEffect, useState } from 'react';
import {
  screenPercentageToDP,
  Orientation,
} from '/helpers/screen';
import { theme } from '/styled/theme';
import { Button } from '../Button';

export const AutocompleteModalField = ({
  value,
  placeholder,
  onChange,
  suggester,
  options,
  modalRoute,
  navigation,
}): JSX.Element => {
  const [label, setLabel] = useState(placeholder);
  const onPress = (selectedItem): void => {
    onChange(selectedItem.value);
    setLabel(selectedItem.label);
  };

  const openModal = (): void => navigation.navigate(modalRoute, {
    callback: onPress,
    suggester,
    options,
  });

  useEffect(() => {
    if (!value || !suggester) return;
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
