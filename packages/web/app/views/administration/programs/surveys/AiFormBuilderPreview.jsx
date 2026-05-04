import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Tooltip } from '@mui/material';
import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  Button,
  Form,
  SurveyScreenPaginator,
  TAMANU_COLORS,
  TranslatedText,
} from '@tamanu/ui-components';
import { getComponentForQuestionType } from '../../../../components/Surveys';

const PREVIEW_SELECT_OPTIONS = ['Yes', 'No', 'Prefer not to say'];
const EMPTY_FORM_VALUES = {};
const noopAsync = async () => {};

const previewEnter = keyframes`
  from {
    opacity: 0;
    transform: translateX(18px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const PreviewColumn = styled.aside`
  animation: ${previewEnter} 220ms ease-out;
  background: ${TAMANU_COLORS.white};
  border-inline-start: 1px solid ${TAMANU_COLORS.outline};
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  align-items: center;
  border-block-end: 1px solid ${TAMANU_COLORS.outline};
  display: grid;
  grid-template-columns: auto 1fr auto;
  min-block-size: 48px;
  padding: 0 20px;
`;

const PreviewTitleHeader = styled(PreviewHeader)`
  border-block-end: 0;
  grid-template-columns: 56px 1fr 56px;
  min-block-size: 66px;
  padding: 0 28px;
`;

const PreviewHeaderSpacer = styled.div`
  block-size: 1px;
  inline-size: 24px;
`;

const PreviewHeading = styled.div`
  color: ${TAMANU_COLORS.darkText};
  font-size: 14px;
  font-weight: 500;
  justify-self: center;
`;

const PreviewFormTitle = styled.h2`
  color: ${TAMANU_COLORS.darkText};
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
  text-align: center;
`;

const PreviewProgress = styled.div`
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(${({ $segments }) => $segments}, 1fr);
`;

const PreviewProgressSegment = styled.div`
  background: ${({ $active }) => ($active ? TAMANU_COLORS.primary : TAMANU_COLORS.midText)};
  block-size: 5px;
`;

const PreviewBody = styled.div`
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  padding: 28px 18px 0;
`;

const PreviewSurveyWrap = styled.div`
  margin-block-start: 14px;
  padding-block-end: 42px;
`;

const PreviewSubmitTooltipTarget = styled.div`
  display: inline-flex;
`;

const createPreviewSurvey = form => ({
  id: 'ai-form-builder-preview',
  name: form.title,
  components: form.sections.flatMap((section, sectionIndex) => [
    {
      id: `ai-preview-section-${sectionIndex}`,
      dataElementId: `ai-preview-section-${sectionIndex}`,
      screenIndex: sectionIndex,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      dataElement: {
        id: `ai-preview-section-${sectionIndex}`,
        type: PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION,
        defaultText: section.title,
      },
    },
    ...section.questions.map((question, questionIndex) => {
      const id = `ai-preview-question-${sectionIndex}-${questionIndex}`;
      return {
        id,
        dataElementId: id,
        screenIndex: sectionIndex,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        dataElement: {
          id,
          type: PROGRAM_DATA_ELEMENT_TYPES.SELECT,
          defaultText: question,
          defaultOptions: PREVIEW_SELECT_OPTIONS,
        },
      };
    }),
  ]),
});

const getPreviewScreenCount = survey =>
  Math.max(1, ...survey.components.map(component => component.screenIndex + 1));

function PreviewSubmitButton() {
  return (
    <Tooltip
      title={
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.preview.submit.tooltip"
          fallback="This is a preview only. No data can be submitted."
        />
      }
    >
      <PreviewSubmitTooltipTarget>
        <Button color="primary" variant="contained" functionallyDisabled>
          <TranslatedText stringId="general.action.submit" fallback="Submit" />
        </Button>
      </PreviewSubmitTooltipTarget>
    </Tooltip>
  );
}

export function FormPreview({ form }) {
  const previewSurvey = useMemo(() => (form ? createPreviewSurvey(form) : null), [form]);

  if (!form) return null;

  const screenCount = getPreviewScreenCount(previewSurvey);

  return (
    <PreviewColumn>
      <PreviewHeader>
        <PreviewHeaderSpacer aria-hidden="true" />
        <PreviewHeading>
          <TranslatedText
            stringId="admin.programs.aiFormBuilder.preview.heading"
            fallback="Form preview"
          />
        </PreviewHeading>
        <PreviewHeaderSpacer aria-hidden="true" />
      </PreviewHeader>
      <PreviewTitleHeader>
        <ArrowBackIosNewIcon htmlColor={TAMANU_COLORS.primary} fontSize="small" />
        <PreviewFormTitle>{form.title}</PreviewFormTitle>
        <PreviewHeaderSpacer aria-hidden="true" />
      </PreviewTitleHeader>
      <PreviewProgress $segments={screenCount} aria-hidden="true">
        {Array.from({ length: screenCount }, (_, index) => (
          <PreviewProgressSegment key={index} $active={index === 0} />
        ))}
      </PreviewProgress>
      <PreviewBody>
        <PreviewSurveyWrap>
          <Form
            initialValues={EMPTY_FORM_VALUES}
            onSubmit={noopAsync}
            render={({
              values,
              setFieldValue,
              validateForm,
              setErrors,
              errors,
              setStatus,
              status,
            }) => (
              <SurveyScreenPaginator
                survey={previewSurvey}
                values={values}
                setFieldValue={setFieldValue}
                onSurveyComplete={noopAsync}
                validateForm={validateForm}
                setErrors={setErrors}
                errors={errors}
                setStatus={setStatus}
                status={status}
                getComponentForQuestionType={getComponentForQuestionType}
                summarySubmitButton={<PreviewSubmitButton />}
              />
            )}
          />
        </PreviewSurveyWrap>
      </PreviewBody>
    </PreviewColumn>
  );
}
