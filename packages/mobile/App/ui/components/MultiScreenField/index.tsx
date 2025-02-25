import React, { useState, ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView } from '/styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { Routes } from '~/ui/helpers/routes';
import { OptionType } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';

interface MultiScreenFieldProps {
  screens: {
    id: string;
    modalRoute?: string;
    modalProps?: Record<string, unknown>;
  }[];
  values?: Record<string, OptionType>;
  placeholder?: string;
  onChange: (newValue: Record<string, OptionType>) => void;
  marginTop?: number;
  error?: string;
  disabled?: boolean;
}

const defaultModalRoute = Routes.Autocomplete.Modal;

export const MultiScreenField = ({
  screens,
  values,
  onChange,
  marginTop,
  error,
  disabled,
  placeholder,
}: MultiScreenFieldProps): ReactElement => {
  const navigation = useNavigation();
  const buildLabel = (values: Record<string, OptionType>): string => {
    if (!values) return '';

    return `${values[screens[0].id]?.label} ${screens
      .slice(1)
      .map(({ id }) => `(${values[id]?.label})`)
      .join(' ')}`;
  };
  const [label, setLabel] = useState(buildLabel(values));

  const onPress = (
    newValue: OptionType,
    values: Record<string, OptionType> = {},
    screenIndex: number = 0,
  ) => {
    const newValues = { ...values, [screens[screenIndex].id]: newValue };
    if (screenIndex < screens.length - 1) {
      // Still screens remaining, navigate to next screen
      const { modalRoute = defaultModalRoute, modalProps } = screens[screenIndex + 1];
      navigation.navigate(modalRoute, {
        callback: (newValue) => onPress(newValue, newValues, screenIndex + 1),
        ...modalProps,
      });
    } else {
      // Submit values
      setLabel(buildLabel(newValues));
      onChange({ ...newValues });
    }
  };

  const openModal = () => {
    const { modalRoute = defaultModalRoute, modalProps } = screens[0];
    navigation.navigate(modalRoute, {
      callback: (newValue: OptionType) => onPress(newValue, values),
      ...modalProps,
    });
  };

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      <Button
        marginTop={marginTop}
        backgroundColor={theme.colors.WHITE}
        textColor={label ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_SOFT}
        buttonText={label || placeholder || 'Select'}
        minHeight={screenPercentageToDP(6.68, Orientation.Height)}
        height={'auto'}
        justifyContent="flex-start"
        borderRadius={3}
        borderStyle="solid"
        borderColor={error ? theme.colors.ERROR : '#EBEBEB'}
        borderWidth={1}
        fontWeight={400}
        fontSize={15}
        padding={10}
        onPress={openModal}
        disabled={disabled}
      />
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
