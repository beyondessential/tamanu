import React, { ReactElement, FC, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
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
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '~/constants/programRegistries';
import { TranslatedEnum, getEnumStringId } from '~/ui/components/Translations/TranslatedEnum';
import { getReferenceDataStringId } from '~/ui/components/Translations/TranslatedReferenceData';

interface FieldValue {
  label: string;
  value: string;
}

interface ConditionAndCategory {
  condition: FieldValue;
  programRegistryCategory: FieldValue;
}

interface PatientProgramRegistrationConditionsFieldItemProps {
  conditionSuggester: Suggester;
  categorySuggester: Suggester;
  value?: ConditionAndCategory;
  onChange: (newValue: ConditionAndCategory) => void;
  onDelete?: () => void;
  marginTop?: number;
  error?: string;
  disabled?: boolean;
  isNewlyCreated?: boolean;
}

const EXCLUDED_CONDITION_CATEGORIES = [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR];

const PatientProgramRegistrationConditionsFieldItem = ({
  value,
  conditionSuggester,
  categorySuggester,
  onChange,
  onDelete,
  marginTop,
  error,
  disabled,
  isNewlyCreated,
}: PatientProgramRegistrationConditionsFieldItemProps): ReactElement => {
  const navigation = useNavigation();
  const { getTranslation } = useTranslation();

  const [condition, setCondition] = useState(value?.condition);
  const [programRegistryCategory, setProgramRegistryCategory] = useState(value?.programRegistryCategory);
  const [hasOpenedConditionScreenImmediately, setHasOpenedConditionScreenImmediately] =
    useState(false);

  const buildLabel = useCallback(() => {
    if (!condition || !programRegistryCategory) return '';

    const conditionStringId = getReferenceDataStringId('programRegistryCondition', condition.value);
    const conditionLabel = getTranslation(conditionStringId, condition.label);
    const categoryStringId = getEnumStringId(
      programRegistryCategory.value,
      PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
    );
    const categoryLabel = getTranslation(
      categoryStringId,
      PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[programRegistryCategory.value],
    );

    return `${conditionLabel} (${categoryLabel})`;
  }, [condition, programRegistryCategory, getTranslation]);

  const [label, setLabel] = useState(buildLabel());

  useEffect(() => {
    setLabel(buildLabel());
  }, [setLabel, buildLabel]);

  const openCategoryScreen = useCallback(
    (newCondition) => {
      navigation.navigate(Routes.Forms.AutocompleteModal, {
        callback: (newValue: FieldValue) => {
          // Submit values
          setProgramRegistryCategory(newValue);
          setCondition(newCondition);
          onChange({ condition: newCondition, programRegistryCategory: newValue });
        },
        onClickBack: (newNavigation) => {
          Alert.alert(
            getTranslation(
              'programRegistry.category.categoryIsRequiredWarning.title',
              'Category is required',
            ),
            getTranslation(
              'programRegistry.category.categoryIsRequiredWarning.description',
              'Selecting a relevant category is required in order to record a related condition.\nPlease add a category otherwise cancel adding the related condition.',
            ),
            [
              {
                text: getTranslation(
                  'programRegistry.category.cancelAddingRelatedCondition',
                  'Cancel adding related condition',
                ),
                style: 'cancel',
                onPress: () => {
                  if (isNewlyCreated) {
                    onDelete();
                  }
                  newNavigation.goBack();
                },
              },
              {
                text: getTranslation('programRegistry.category.addCategoryLabel', 'Add category'),
              },
            ],
            {
              cancelable: true,
            },
          );
        },
        suggester: categorySuggester,
        modalTitle: getTranslation('programRegistry.category.addCategoryLabel', 'Add category'),
      });
    },
    [setProgramRegistryCategory, onChange, isNewlyCreated, onDelete, getTranslation, navigation, categorySuggester],
  );

  const openConditionScreen = useCallback(() => {
    navigation.navigate(Routes.Forms.AutocompleteModal, {
      callback: (newValue: FieldValue) => {
        openCategoryScreen(newValue);
      },
      suggester: conditionSuggester,
      modalTitle: getTranslation(
        'programRegistry.relatedConditions.addConditionLabel',
        'Add related condition',
      ),
    });
  }, [openCategoryScreen, getTranslation, conditionSuggester, navigation]);

  useEffect(() => {
    if (isNewlyCreated && !hasOpenedConditionScreenImmediately) {
      openConditionScreen();
      setHasOpenedConditionScreenImmediately(true);
    }
  }, [
    openConditionScreen,
    isNewlyCreated,
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

  const conditionSuggester = new Suggester({
    model: models.ProgramRegistryCondition,
    options: {
      where: {
        programRegistry: programRegistryId,
      },
    },
    filter: ({ id }) => !conditions.map((value) => value?.condition?.value).includes(id), // hide previously selected conditions
  });

  const categorySuggester = new Suggester(
    models.ProgramRegistryCategory,
    {
      where: {
        programRegistry: programRegistryId,
      },
    },
    undefined,
    ({ id }) => true, // show all categories
  );

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
          categorySuggester={categorySuggester}
          onChange={addItem}
        />
      ) : (
        conditions.map((value, index) => (
          <PatientProgramRegistrationConditionsFieldItem
            key={index}
            value={value}
            conditionSuggester={conditionSuggester}
            categorySuggester={categorySuggester}
            onChange={editItem(index)}
            onDelete={deleteItem(index)}
            isNewlyCreated={value === undefined} // Newly created item
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
