import React, { useEffect, useState, ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView, StyledText } from '/styled/common';
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
  label?: string;
}

export const AutocompleteModalField = ({
  label: fieldLabel,
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
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      <StyledText fontSize={14} marginBottom={2} color={theme.colors.TEXT_SUPER_DARK}>
        {fieldLabel}
      </StyledText>
      <Button
        marginTop={marginTop}
        backgroundColor={theme.colors.WHITE}
        textColor="#888888"
        buttonText={label || placeholder || 'Select'}
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
    </StyledView>
  );
};
