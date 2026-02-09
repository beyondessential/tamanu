import React, { ReactElement, FC, useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StyledView, StyledText, StyledTouchableOpacity } from '/styled/common';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { Suggester } from '~/ui/helpers/suggester';
import { Routes } from '~/ui/helpers/routes';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '~/ui/components/RequiredIndicator';
import { Button } from '~/ui/components/Button';
import { CrossIcon } from '~/ui/components/Icons';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '~/constants/programRegistries';
import { getReferenceDataStringId } from '~/ui/components/Translations/TranslatedReferenceData';
import { IProgramRegistryConditionCategory } from '~/types/IProgramRegistryConditionCategory';
import { VisibilityStatus } from '~/visibilityStatuses';

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
  isNewlyCreated?: boolean;
  conditionCategoryOptions: FieldValue[];
}

const getConditionCategoryOptions = (
  conditionCategories: IProgramRegistryConditionCategory[],
  getTranslation: (stringId: string, fallback: string) => string,
) => {
  if (!conditionCategories) return [];

  return conditionCategories.filter((category: IProgramRegistryConditionCategory) =>
    category.code !== PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
  )
  .map((category: IProgramRegistryConditionCategory) => ({
    value: category.id,
    label: getTranslation(
      getReferenceDataStringId(category.id, 'programRegistryConditionCategory'),
      category.name,
    ),
  }));
}

const PatientProgramRegistrationConditionsFieldItem = ({
  value,
  conditionSuggester,
  onChange,
  onDelete,
  marginTop,
  error,
  disabled,
  isNewlyCreated,
  conditionCategoryOptions,
}: PatientProgramRegistrationConditionsFieldItemProps): ReactElement => {
  const navigation = useNavigation();
  const { getTranslation } = useTranslation();

  const [condition, setCondition] = useState(value?.condition);
  const [category, setCategory] = useState(value?.category);
  const [hasOpenedConditionScreenImmediately, setHasOpenedConditionScreenImmediately] =
    useState(false);

  const buildLabel = useCallback(() => {
    if (!condition || !category) return '';

    const conditionStringId = getReferenceDataStringId(condition.value, 'programRegistryCondition');
    const conditionLabel = getTranslation(conditionStringId, condition.label);
    const categoryStringId = getReferenceDataStringId(category.value, 'programRegistryConditionCategory');
    const categoryLabel = getTranslation(categoryStringId, category.label);

    return `${conditionLabel} (${categoryLabel})`;
  }, [condition, category, getTranslation]);

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
          setCondition(newCondition);
          onChange({ condition: newCondition, category: newValue });
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
        options: conditionCategoryOptions,
        modalTitle: getTranslation('programRegistry.category.addCategoryLabel', 'Add category'),
      });
    },
    [setCategory,
      onChange,
      isNewlyCreated,
      onDelete,
      getTranslation,
      navigation,
      conditionCategoryOptions,
    ],
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

  const [conditionCategories] = useBackendEffect(({ models }) => 
    models.ProgramRegistryConditionCategory.find({
      where: {
        programRegistry: { id: programRegistryId },
        visibilityStatus: VisibilityStatus.Current,
      },
    }),
    [programRegistryId],
  );

  // Filter out recorded in error category and map to options
  const conditionCategoryOptions = getConditionCategoryOptions(
    conditionCategories,
    getTranslation,
  );

  const conditionSuggester = useMemo(
    () =>
      new Suggester({
        model: models.ProgramRegistryCondition,
        options: {
          where: {
            programRegistry: programRegistryId,
          },
        },
        filter: ({ entity_id }) => {
          // hide previously selected conditions
          return !conditions.map((value) => value?.condition?.value).includes(entity_id);
        },
      }),
    [models.ProgramRegistryCondition, programRegistryId, conditions],
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
          onChange={addItem}
          conditionCategoryOptions={conditionCategoryOptions}
        />
      ) : (
        conditions.map((value, index) => (
          <PatientProgramRegistrationConditionsFieldItem
            key={index}
            value={value}
            conditionSuggester={conditionSuggester}
            onChange={editItem(index)}
            onDelete={deleteItem(index)}
            isNewlyCreated={value === undefined} // Newly created item
            conditionCategoryOptions={conditionCategoryOptions}
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
