import React, { useEffect, useState, ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { Suggester, BaseModelSubclass } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';

interface AutocompleteModalFieldProps {
  value?: string;
  placeholder?: string;
  onChange: (newValue: string) => void;
  suggester: Suggester<BaseModelSubclass>;
  modalRoute: string;
  marginTop?: number;
  error?: string;
}

export const AutocompleteModalField = ({
  value,
  placeholder,
  onChange,
  suggester,
  modalRoute,
  error,
  marginTop = 0,
}: AutocompleteModalFieldProps): ReactElement => {
  const navigation = useNavigation();
  const [label, setLabel] = useState(placeholder);
  const onPress = (selectedItem): void => {
    onChange(selectedItem.value);
    setLabel(selectedItem.label);
  };

  const openModal = (): void =>
    navigation.navigate(modalRoute, {
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
    <>
      <Button
        marginTop={marginTop}
        backgroundColor={theme.colors.WHITE}
        textColor="#888888"
        buttonText={label}
        height={screenPercentageToDP(6.68, Orientation.Height)}
        justifyContent="flex-start"
        borderRadius={3}
        borderStyle="solid"
        borderColor={error ? theme.colors.ERROR : '#EBEBEB'}
        borderWidth={1}
        fontWeight={400}
        fontSize={15}
        padding={10}
        onPress={openModal}
      />
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </>
  );
};
