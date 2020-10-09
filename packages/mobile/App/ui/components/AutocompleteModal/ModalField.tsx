import React, { useEffect, useState } from 'react';
import {
  screenPercentageToDP,
  Orientation,
} from '/helpers/screen';
import { theme } from '/styled/theme';
import { Button } from '../Button';

export const ModalField = ({
  value,
  placeholder,
  onChange,
  suggester,
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
  });

  useEffect(() => {
    if (!value) return;
    (async (): Promise<void> => {
      const data = await suggester.fetchCurrentOption(value);
      setLabel(data.label);
    })();
  }, []);

  return (
    <Button
      marginTop={screenPercentageToDP(1.22, Orientation.Height)}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      buttonText={label}
      onPress={openModal} // bring up modal
    />
  );
};
