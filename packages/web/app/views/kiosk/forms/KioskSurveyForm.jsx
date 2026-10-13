import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Formik, useFormikContext } from 'formik';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants/forms';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import {
  getFormInitialValues,
  getValidationSchema,
  SurveyQuestion,
  TranslatedReferenceData,
  useDateTime,
} from '@tamanu/ui-components';

import { TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { BackIcon, NextIcon } from '../KioskIcons';
import { PrimaryButton, scaled, SecondaryButton, Title, whenCompact } from '../kioskStyles';
import { getVisibleComponents } from './kioskForms';
import { getKioskComponentForQuestionType } from './kioskQuestions';

const FormPanel = styled.main`
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--kiosk-surface);
  border: var(--kiosk-border) solid var(--kiosk-outline);
  border-radius: 16px;
  overflow: hidden;
`;

const FormHead = styled.div`
  flex: none;
  padding: ${scaled(32)} ${scaled(36)} 0;

  ${whenCompact`
    padding: ${scaled(20)} ${scaled(20)} 0;
  `}
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${scaled(16)};
  margin-bottom: ${scaled(12)};
`;

const FormTitle = styled(Title)`
  margin: 0;
  font-size: ${scaled(30)};
`;

const PageCount = styled.div`
  flex: none;
  font-size: ${scaled(16)};
  font-weight: 500;
  color: var(--kiosk-text-secondary);
`;

const PageBar = styled.div`
  height: ${scaled(8)};
  margin-bottom: ${scaled(20)};
  border-radius: 4px;
  background: var(--kiosk-line);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--kiosk-primary);
    transition: width 200ms;
  }
`;

const Questions = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${scaled(4)} ${scaled(36)} ${scaled(16)};
  scroll-padding: ${scaled(24)};

  ${whenCompact`
    padding: ${scaled(4)} ${scaled(20)} ${scaled(16)};
  `}

  /* Shared fields reused for dates, times, search, photos and signatures, sized for touch */
  .MuiFormLabel-root,
  .MuiFormControlLabel-label,
  label.MuiTypography-root,
  label.label-field {
    display: block;
    margin-bottom: ${scaled(14)};
    font-size: ${scaled(20)} !important;
    font-weight: 500;
    color: var(--kiosk-text) !important;
    line-height: 1.35;
  }

  .MuiInputBase-root {
    min-height: ${scaled(60)};
    font-size: ${scaled(20)};
    border-radius: 14px;
    background: var(--kiosk-surface);
    color: var(--kiosk-text);
  }

  .MuiOutlinedInput-notchedOutline {
    border-color: var(--kiosk-outline);
    border-radius: 14px;
  }

  .react-autosuggest__suggestion .MuiMenuItem-root {
    min-height: ${scaled(54)};
    font-size: ${scaled(18)};
  }

  .MuiFormHelperText-root {
    font-size: ${scaled(15)};
  }
`;

const QuestionCard = styled.div`
  padding: ${scaled(20)} ${scaled(24)};
  border-radius: 16px;
  border: var(--kiosk-border) solid var(--kiosk-outline);
  background: var(--kiosk-surface);

  & + & {
    margin-top: ${scaled(12)};
  }

  /* Instructions are information, not a question, so they sit on the page without a card */
  &[data-plain='true'] {
    padding: 0;
    border: none;
  }
`;

const PLAIN_QUESTION_TYPES = new Set([
  PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION,
  PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT,
]);

const FormActions = styled.div`
  flex: none;
  display: flex;
  justify-content: space-between;
  gap: ${scaled(14)};
  padding: ${scaled(20)} ${scaled(36)} ${scaled(24)};
  border-top: var(--kiosk-border) solid var(--kiosk-line);

  ${whenCompact`
    padding: ${scaled(16)} ${scaled(20)} ${scaled(20)};
  `}
`;

const NextButton = styled(PrimaryButton)`
  min-width: min(${scaled(220)}, 50%);
`;

/** Keeps calculated questions up to date as the answers they depend on change. */
const useCalculatedValues = (components, values, setFieldValue) => {
  useEffect(() => {
    const calculatedValues = runCalculations(components, values);
    for (const [dataElementId, value] of Object.entries(calculatedValues)) {
      const isUnchanged =
        values[dataElementId] === value ||
        ((values[dataElementId] ?? '') === '' && (value ?? '') === '');
      if (!isUnchanged) setFieldValue(dataElementId, value, false);
    }
  }, [components, values, setFieldValue]);
};

const FormPages = ({
  form,
  patient,
  pageIndex,
  setPageIndex,
  onSaveProgress,
  onComplete,
  onExit,
}) => {
  const { values, setFieldValue, validateForm, setStatus, setTouched } = useFormikContext();
  const questionsRef = useRef(null);
  useCalculatedValues(form.currentComponents, values, setFieldValue);

  // Answers are kept on the tablet so the patient can move between forms without losing them
  const valuesRef = useRef(values);
  valuesRef.current = values;
  useEffect(() => () => onSaveProgress({ values: valuesRef.current }), [onSaveProgress]);

  const isPageVisible = index =>
    getVisibleComponents(form.pages[index], values, form.currentComponents).length > 0;
  const findPage = (fromIndex, step) => {
    for (let index = fromIndex + step; index >= 0 && index < form.pages.length; index += step) {
      if (isPageVisible(index)) return index;
    }
    return null;
  };

  const visibleQuestions = getVisibleComponents(
    form.pages[pageIndex] ?? [],
    values,
    form.currentComponents,
  );

  const goToPage = index => {
    setPageIndex(index);
    setStatus({});
    setTouched({}, false);
    onSaveProgress({ values, pageIndex: index });
    questionsRef.current?.scrollTo({ top: 0 });
  };

  const handleNext = async () => {
    const errors = await validateForm();
    const firstInvalid = visibleQuestions.find(({ dataElementId }) => errors[dataElementId]);
    if (firstInvalid) {
      setStatus({ submitStatus: SUBMIT_ATTEMPTED_STATUS });
      questionsRef.current
        ?.querySelector(`[data-question-id="${CSS.escape(firstInvalid.dataElementId)}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const nextPage = findPage(pageIndex, 1);
    if (nextPage === null) {
      onComplete(values);
    } else {
      goToPage(nextPage);
    }
  };

  const handleBack = () => {
    const previousPage = findPage(pageIndex, -1);
    if (previousPage === null) {
      onSaveProgress({ values });
      onExit();
    } else {
      goToPage(previousPage);
    }
  };

  const pageCount = form.pages.length;
  return (
    <FormPanel aria-labelledby="kiosk-form-title">
      <FormHead>
        <TitleRow>
          <FormTitle id="kiosk-form-title">
            <TranslatedReferenceData category="survey" value={form.id} fallback={form.name} />
          </FormTitle>
          <PageCount>
            <TranslatedText
              stringId="kiosk.form.pageCount"
              fallback="Page :page of :pageCount"
              replacements={{ page: pageIndex + 1, pageCount }}
            />
          </PageCount>
        </TitleRow>
        <PageBar
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={pageCount}
          aria-valuenow={pageIndex + 1}
        >
          <span style={{ width: `${((pageIndex + 1) / pageCount) * 100}%` }} />
        </PageBar>
      </FormHead>
      <Questions ref={questionsRef}>
        {visibleQuestions.map(component => (
          <QuestionCard
            key={component.id}
            data-question-id={component.dataElementId}
            data-plain={PLAIN_QUESTION_TYPES.has(component.dataElement.type)}
          >
            <SurveyQuestion
              component={component}
              patient={patient}
              getComponentForQuestionType={getKioskComponentForQuestionType}
            />
          </QuestionCard>
        ))}
      </Questions>
      <FormActions>
        <SecondaryButton onClick={handleBack}>
          <BackIcon />
          <TranslatedText stringId="general.action.back" fallback="Back" />
        </SecondaryButton>
        <NextButton onClick={handleNext} data-testid="kiosk-form-next">
          <TranslatedText stringId="general.action.next" fallback="Next" />
          <NextIcon />
        </NextButton>
      </FormActions>
    </FormPanel>
  );
};

/**
 * One kiosk form, page by page. Remount it (by `key`) to open a different form.
 *
 * @param {object} props
 * @param {ReturnType<import('./kioskForms').toKioskForm>} props.form
 * @param {{ values?: object, pageIndex?: number }} props.progress Where the patient left this form
 * @param {(progress: object) => void} props.onSaveProgress Stable callback
 */
export const KioskSurveyForm = ({
  form,
  patient,
  patientAdditionalData,
  progress,
  onSaveProgress,
  onComplete,
  onExit,
}) => {
  const { getTranslation } = useTranslation();
  const { getCurrentDateTime } = useDateTime();
  const [pageIndex, setPageIndex] = useState(() =>
    Math.min(progress?.pageIndex ?? 0, form.pages.length - 1),
  );

  const [initialValues] = useState(
    () =>
      progress?.values ??
      getFormInitialValues({
        components: form.currentComponents,
        patient,
        additionalData: patientAdditionalData,
        getCurrentDateTime,
      }),
  );

  const validationSchema = useMemo(() => {
    return getValidationSchema({ components: form.shownComponents }, getTranslation, {}, {
      requiredMessage: getTranslation('kiosk.form.required', 'This question is required'),
    });
  }, [form, getTranslation]);

  return (
    <Formik
      initialValues={initialValues}
      initialStatus={{}}
      validationSchema={validationSchema}
      validateOnChange
      validateOnBlur={false}
      onSubmit={() => {}}
    >
      <FormPages
        form={form}
        patient={patient}
        pageIndex={pageIndex}
        setPageIndex={setPageIndex}
        onSaveProgress={onSaveProgress}
        onComplete={onComplete}
        onExit={onExit}
      />
    </Formik>
  );
};
