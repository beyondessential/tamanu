import React, { ReactElement, FC, useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView, StyledText, StyledTouchableOpacity } from '/styled/common';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { useBackend } from '~/ui/hooks';
import { Suggester } from '~/ui/helpers/suggester';
import { Routes } from '~/ui/helpers/routes';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '~/ui/components/RequiredIndicator';
import { Button } from '~/ui/components/Button';
import { CrossIcon } from '~/ui/components/Icons';
import { useTranslation } from '~/ui/contexts/TranslationContext';

interface FieldValue {
  label: string;
  value: string;
}

interface ConditionAndCategory {
  condition: FieldValue;
  category: FieldValue;
}

interface PatientProgramRegistrationConditionsFieldItemProps {
  conditionSuggester: Suggester;
  value?: ConditionAndCategory;
  onChange: (newValue: ConditionAndCategory) => void;
  onDelete?: () => void;
  marginTop?: number;
  error?: string;
  disabled?: boolean;
  openConditionScreenImmediately?: boolean;
}

const PatientProgramRegistrationConditionsFieldItem = ({
  value,
  conditionSuggester,
  onChange,
  onDelete,
  marginTop,
  error,
  disabled,
  openConditionScreenImmediately,
}: PatientProgramRegistrationConditionsFieldItemProps): ReactElement => {
  const navigation = useNavigation();
  const { getTranslation } = useTranslation();

  const [condition, setCondition] = useState(value?.condition);
  const [category, setCategory] = useState(value?.category);
  const [hasOpenedConditionScreenImmediately, setHasOpenedConditionScreenImmediately] =
    useState(false);

  const buildLabel = useCallback(() => {
    if (!condition || !category) return '';

    return `${condition.label} (${category.label})`;
  }, [condition, category]);

  const [label, setLabel] = useState(buildLabel());

  useEffect(() => {
    setLabel(buildLabel());
  }, [setLabel, buildLabel]);

  const openCategoryScreen = useCallback(
    (newCondition) => {
      navigation.navigate(Routes.Forms.SelectModal, {
        callback: (newValue: FieldValue) => {
          // Submit values
          setCategory(newValue);
          onChange({ condition: newCondition, category: newValue });
        },
        options: [
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'suspected', label: 'Suspected' },
          { value: 'under_investigation', label: 'Under investigation' },
          { value: 'disproved', label: 'Disproved' },
          { value: 'resolved', label: 'Resolved' },
        ],
        modalTitle: getTranslation('programRegistry.category.label', 'Category'),
      });
    },
    [setCategory, onChange, getTranslation, navigation],
  );

  const openConditionScreen = useCallback(() => {
    navigation.navigate(Routes.Forms.AutocompleteModal, {
      callback: (newValue: FieldValue) => {
        setCondition(newValue);
        openCategoryScreen(newValue);
      },
      suggester: conditionSuggester,
      modalTitle: getTranslation('programRegistry.conditions.label', 'Conditions'),
    });
  }, [setCondition, openCategoryScreen, getTranslation, conditionSuggester, navigation]);

  useEffect(() => {
    if (openConditionScreenImmediately && !hasOpenedConditionScreenImmediately) {
      openConditionScreen();
      setHasOpenedConditionScreenImmediately(true);
    }
  }, [
    openConditionScreen,
    openConditionScreenImmediately,
    hasOpenedConditionScreenImmediately,
    setHasOpenedConditionScreenImmediately,
  ]);

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      <StyledView>
        <Button
          marginTop={marginTop}
          backgroundColor={theme.colors.WHITE}
          textColor={label ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_SOFT}
          buttonText={label || getTranslation('general.placeholder.search', 'Search')}
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
          onPress={openConditionScreen}
          disabled={disabled}
        />
        {onDelete && (
          <StyledTouchableOpacity
            style={{ position: 'absolute', top: '38%', right: '6%' }}
            onPress={onDelete}
          >
            <CrossIcon
              fill={theme.colors.TEXT_SUPER_DARK}
              size={screenPercentageToDP(1.6, Orientation.Height)}
            />
          </StyledTouchableOpacity>
        )}
      </StyledView>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};

interface PatientProgramRegistrationConditionsFieldProps {
  ListItemComponent: FC<{ onChange: (newValue: unknown) => void; value?: unknown }>;
  programRegistryId: string;
  label?: string;
  values?: ConditionAndCategory[];
  onChange: (newValue: ConditionAndCategory[]) => void;
  marginTop?: number;
  error?: string;
  required?: boolean;
}

export const PatientProgramRegistrationConditionsField = ({
  programRegistryId,
  label,
  values = [],
  onChange,
  error,
  required,
}: PatientProgramRegistrationConditionsFieldProps): ReactElement => {
  const [conditions, setConditions] = useState(values);
  const { models } = useBackend();
  const { getTranslation } = useTranslation();

  const conditionSuggester = new Suggester(models.ProgramRegistryCondition, {
    where: {
      programRegistry: programRegistryId,
    },
  });

  const addItem = (newValue: ConditionAndCategory) => {
    onChange([...conditions, newValue]);
    setConditions([...conditions, newValue]);
  };
  const editItem = (index) => (newValue: ConditionAndCategory) => {
    const newValues = conditions.map((value, i) => (i === index ? newValue : value));
    onChange(newValues);
    setConditions(newValues);
  };
  const deleteItem = (index) => () => {
    const newValues = conditions.slice(0, index).concat(conditions.slice(index + 1));
    onChange(newValues);
    setConditions(newValues);
  };

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      {!!label && (
        <StyledText
          fontSize={14}
          fontWeight={600}
          marginBottom={2}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          {label}
          {required && <RequiredIndicator />}
        </StyledText>
      )}
      {conditions.length < 1 ? (
        <PatientProgramRegistrationConditionsFieldItem
          conditionSuggester={conditionSuggester}
          onChange={addItem}
        />
      ) : (
        conditions.map((value, index) => (
          <PatientProgramRegistrationConditionsFieldItem
            key={index}
            value={value}
            conditionSuggester={conditionSuggester}
            onChange={editItem(index)}
            onDelete={deleteItem(index)}
            openConditionScreenImmediately={value === undefined} // Newly created item
          />
        ))
      )}
      {conditions.length > 0 && (
        <Button
          backgroundColor="transparent"
          textColor={theme.colors.BRIGHT_BLUE}
          buttonText={`+ ${getTranslation('general.action.addAdditional', 'Add additional')}`}
          height={'auto'}
          justifyContent="flex-start"
          borderStyle="solid"
          borderWidth={1}
          fontWeight={600}
          fontSize={14}
          onPress={() => addItem(undefined)}
        />
      )}
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
