import React from 'react';
import { TranslatedText } from './TranslatedText';

/**
 * Replace any spaces and dots with underscores (dots are the delimiter in translation ids)
 *
 * @example "hello world" → "hello_world"
 * @example "test.value" → "test_value"
 * @example "hello.world test" → "hello_world_test"
 */
const formatOptionForStringId = (str: string) => `${str}`.replace(/[\s.]/g, '_');

/**
 * Returns the stringId for a reference data option.
 * @example getReferenceDataOptionStringId('question1', 'surveyScreenComponent', 'undecided') -> "refData.surveyScreenComponent.detail.question1.option.undecided"
 */
export const getReferenceDataOptionStringId = (value: string, category: string, option: string) => {
  const baseStringId = `${getReferenceDataStringId(value, category)}.option`;
  return `${baseStringId}.${formatOptionForStringId(option)}`;
};

export const getReferenceDataStringId = (value: string, category: string) => {
  return `refData.${category}.${value}`;
};

interface TranslatedReferenceDataProps {
  category: string;
  value?: string;
  fallback?: string;
  placeholder?: React.ReactElement;
}

export const TranslatedReferenceData = ({
  category,
  value,
  fallback,
  placeholder,
}: TranslatedReferenceDataProps) => {
  return value ? (
    <TranslatedText stringId={getReferenceDataStringId(value, category)} fallback={fallback} />
  ) : (
    placeholder
  );
};
