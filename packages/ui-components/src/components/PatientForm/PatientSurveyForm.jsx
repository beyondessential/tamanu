import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Formik, useFormikContext } from 'formik';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants/forms';
import { runCalculations } from '@tamanu/shared/utils/calculations';

import { useDateTime, useTranslation } from '../../contexts';
import { getFormInitialValues, getValidationSchema } from '../../utils';
import { SurveyQuestion } from '../Survey';
import { TranslatedReferenceData, TranslatedText } from '../Translation';
import { FormBackIcon, FormNextIcon } from './icons';
import { getVisibleComponents } from './patientForms';
import { PLAIN_QUESTION_TYPES } from './questionTypes';
import { formScaled, FormPrimaryButton, FormSecondaryButton, whenFormCompact } from './styles';

const FormPanel = styled.main`
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--pf-surface);
  border: var(--pf-border) solid var(--pf-outline);
  border-radius: calc(var(--pf-radius, 14px) + 2px);
  overflow: hidden;
`;

const FormHead = styled.div`
  flex: none;
  padding: ${formScaled(32)} ${formScaled(36)} 0;

  ${whenFormCompact`
    padding: ${formScaled(20)} ${formScaled(20)} 0;
  `}
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${formScaled(16)};
  margin-bottom: ${formScaled(12)};
`;

const FormTitle = styled.h1`
  margin: 0;
  font-size: ${formScaled(30)};
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: var(--pf-heading);
`;

const PageCount = styled.div`
  flex: none;
  font-size: ${formScaled(16)};
  font-weight: 500;
  color: var(--pf-text-secondary);
`;

const PageBar = styled.div`
  height: ${formScaled(8)};
  margin-bottom: ${formScaled(20)};
  border-radius: 4px;
  background: var(--pf-line);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--pf-primary);
    transition: width 200ms;
  }
`;

const Questions = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${formScaled(4)} ${formScaled(36)} ${formScaled(16)};
  scroll-padding: ${formScaled(24)};

  ${whenFormCompact`
    padding: ${formScaled(4)} ${formScaled(20)} ${formScaled(16)};
  `}

  /* Shared fields reused for search and signatures, sized to match */
  .MuiFormLabel-root,
  .MuiFormControlLabel-label,
  label.MuiTypography-root,
  label.label-field {
    display: block;
    margin-bottom: ${formScaled(14)};
    font-size: ${formScaled(20)} !important;
    font-weight: 500;
    color: var(--pf-text) !important;
    line-height: 1.35;
  }

  .MuiInputBase-root {
    min-height: ${formScaled(60)};
    font-size: ${formScaled(20)};
    border-radius: var(--pf-radius, 14px);
    background: var(--pf-surface);
    color: var(--pf-text);
  }

  .MuiOutlinedInput-notchedOutline {
    border-color: var(--pf-outline);
    border-radius: var(--pf-radius, 14px);
  }

  .react-autosuggest__suggestion .MuiMenuItem-root {
    min-height: ${formScaled(54)};
    font-size: ${formScaled(18)};
  }

  .MuiFormHelperText-root {
    font-size: ${formScaled(15)};
  }
`;

const QuestionCard = styled.div`
  padding: ${formScaled(20)} ${formScaled(24)};
  border-radius: calc(var(--pf-radius, 14px) + 2px);
  border: var(--pf-border) solid var(--pf-outline);
  background: var(--pf-surface);

  & + & {
    margin-top: ${formScaled(12)};
  }

  ${whenFormCompact`
    padding: ${formScaled(18)} ${formScaled(18)};
  `}

  &[data-plain='true'] {
    padding: 0;
    border: none;
  }
`;

const FormActions = styled.div`
  flex: none;
  display: flex;
  justify-content: space-between;
  gap: ${formScaled(14)};
  padding: ${formScaled(20)} ${formScaled(36)} ${formScaled(24)};
  border-top: var(--pf-border) solid var(--pf-line);

  ${whenFormCompact`
    padding: ${formScaled(16)} ${formScaled(20)} ${formScaled(20)};
  `}
`;

const NextButton = styled(FormPrimaryButton)`
  min-width: min(${formScaled(220)}, 50%);
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
  getComponentForQuestionType,
  onSaveProgress,
  onComplete,
  onExit,
  finishLabel,
  isFinishing,
  testIdPrefix,
}) => {
  const { values, setFieldValue, validateForm, setStatus, setTouched } = useFormikContext();
  const questionsRef = useRef(null);
  const titleId = useId();
  useCalculatedValues(form.currentComponents, values, setFieldValue);

  // Answers are handed back when the form closes, so the patient can return to it later
  const valuesRef = useRef(values);
  valuesRef.current = values;
  useEffect(() => () => onSaveProgress?.({ values: valuesRef.current }), [onSaveProgress]);

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
  const isLastPage = findPage(pageIndex, 1) === null;

  const goToPage = index => {
    setPageIndex(index);
    setStatus({});
    setTouched({}, false);
    onSaveProgress?.({ values, pageIndex: index });
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
    if (isLastPage) {
      onComplete(values);
    } else {
      goToPage(findPage(pageIndex, 1));
    }
  };

  const handleBack = () => {
    const previousPage = findPage(pageIndex, -1);
    if (previousPage === null) {
      onSaveProgress?.({ values });
      onExit();
    } else {
      goToPage(previousPage);
    }
  };

  const pageCount = form.pages.length;
  return (
    <FormPanel aria-labelledby={titleId}>
      <FormHead>
        <TitleRow>
          <FormTitle id={titleId}>
            <TranslatedReferenceData category="survey" value={form.id} fallback={form.name} />
          </FormTitle>
          {pageCount > 1 && (
            <PageCount>
              <TranslatedText
                stringId="patientForm.pageCount"
                fallback="Page :page of :pageCount"
                replacements={{ page: pageIndex + 1, pageCount }}
              />
            </PageCount>
          )}
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
              getComponentForQuestionType={getComponentForQuestionType}
            />
          </QuestionCard>
        ))}
      </Questions>
      <FormActions>
        <FormSecondaryButton onClick={handleBack}>
          <FormBackIcon />
          <TranslatedText stringId="general.action.back" fallback="Back" />
        </FormSecondaryButton>
        <NextButton
          onClick={handleNext}
          disabled={isFinishing}
          data-testid={`${testIdPrefix}-next`}
        >
          {isLastPage && finishLabel ? (
            finishLabel
          ) : (
            <>
              <TranslatedText stringId="general.action.next" fallback="Next" />
              <FormNextIcon />
            </>
          )}
        </NextButton>
      </FormActions>
    </FormPanel>
  );
};

/**
 * A form a patient fills in themselves, page by page, with the questions an app supports for
 * patients. Remount it (by `key`) to open a different form.
 *
 * @param {object} props
 * @param {ReturnType<import('./patientForms').toPatientForm>} props.form
 * @param {(type: string, config?: object) => import('react').ComponentType} props.getComponentForQuestionType
 *   From `createPatientFormQuestionTypes`
 * @param {{ values?: object, pageIndex?: number }} [props.progress] Where the patient left this form
 * @param {(progress: object) => void} [props.onSaveProgress] Stable callback, given the answers
 *   whenever the patient changes page or leaves the form
 * @param {(values: object) => void} props.onComplete Called once the last page is valid
 * @param {() => void} props.onExit Called on Back from the first page
 * @param {import('react').ReactNode} [props.finishLabel] The last page's button, in place of Next
 * @param {boolean} [props.isFinishing] Holds the last page's button while it is being handled
 * @param {import('react').ReactNode} [props.children] Rendered inside the form, for anything that
 *   needs the form's state, like a prompt before unsaved answers are dropped
 */
export const PatientSurveyForm = ({
  form,
  patient,
  patientAdditionalData,
  getComponentForQuestionType,
  progress,
  onSaveProgress,
  onComplete,
  onExit,
  finishLabel,
  isFinishing = false,
  testIdPrefix = 'patient-form',
  children,
}) => {
  const { getTranslation } = useTranslation();
  const { getCurrentDate, getCurrentDateTime } = useDateTime();
  const [pageIndex, setPageIndex] = useState(() =>
    Math.min(progress?.pageIndex ?? 0, form.pages.length - 1),
  );

  const [initialValues] = useState(() => {
    if (progress?.values) return progress.values;
    const values = getFormInitialValues({
      components: form.currentComponents,
      patient,
      additionalData: patientAdditionalData,
      getCurrentDateTime,
    });
    // Submission dates aren't shown to patients, so they're the day the patient fills the form in
    for (const { dataElement } of form.currentComponents) {
      if (dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE) {
        values[dataElement.id] ??= getCurrentDate();
      }
    }
    // Calculations over prefilled answers start out computed, so a form the patient hasn't
    // touched doesn't count as changed
    for (const [dataElementId, value] of Object.entries(
      runCalculations(form.currentComponents, values),
    )) {
      if ((value ?? '') !== '') values[dataElementId] = value;
    }
    return values;
  });

  const validationSchema = useMemo(() => {
    return getValidationSchema(
      { components: form.shownComponents },
      getTranslation,
      {},
      {
        requiredMessage: getTranslation('patientForm.required', 'This question is required'),
      },
    );
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
      <>
        <FormPages
          form={form}
          patient={patient}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          getComponentForQuestionType={getComponentForQuestionType}
          onSaveProgress={onSaveProgress}
          onComplete={onComplete}
          onExit={onExit}
          finishLabel={finishLabel}
          isFinishing={isFinishing}
          testIdPrefix={testIdPrefix}
        />
        {children}
      </>
    </Formik>
  );
};
