import React, { useState } from 'react';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { getReferenceDataCategoryFromRowConfig } from '@tamanu/shared/utils/translation/getReferenceDataCategoryFromRowConfig';
import {
  Button,
  DateDisplay,
  PatientDataDisplayField,
  SurveyResultBadge,
  TranslatedOption,
  TranslatedReferenceData,
  TranslatedText,
} from '@tamanu/ui-components';
import { DisplayTextPseudoResult } from './DisplayTextPseudoResult';
import MultilineResult from './MultilineResult';
import MultiSelectResult from './MultiSelectResult';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { ViewPhotoLink } from './ViewPhotoLink';

const EmptyState = styled.span.attrs({
  'data-testid': 'empty-state-n4wk',
  children: <>&mdash;</>,
})`
  color: ${p => p.theme.palette.text.tertiary};
`;

const AutocompleteCell = ({ answer, originalBody, componentConfig }) => {
  const category = getReferenceDataCategoryFromRowConfig(componentConfig);

  if (!category) {
    return answer;
  }

  return <TranslatedReferenceData fallback={answer} value={originalBody} category={category} />;
};

export const SurveyAnswerResult = ({
  answer,
  type,
  originalBody,
  componentConfig,
  dataElementId,
  surveyComponent,
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [surveyLink, setSurveyLink] = useState(null);

  if (answer === null || answer === undefined || answer === '') {
    return <EmptyState />;
  }

  switch (type) {
    case PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT:
      return surveyComponent ? (
        <DisplayTextPseudoResult
          component={surveyComponent}
          data-testid="displaytextpseudoresult-p4n7"
        />
      ) : (
        answer // Fallback (shouldn’t be reached)
      );
    case PROGRAM_DATA_ELEMENT_TYPES.RESULT:
      return <SurveyResultBadge resultText={answer} data-testid="surveyresultbadge-h25b" />;
    case PROGRAM_DATA_ELEMENT_TYPES.CALCULATED:
      return parseFloat(answer).toFixed(1);
    case PROGRAM_DATA_ELEMENT_TYPES.PHOTO:
      return <ViewPhotoLink imageId={answer} data-testid="viewphotolink-w78m" />;
    case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
      return <DateDisplay date={answer} data-testid="datedisplay-q1xj" />;
    case PROGRAM_DATA_ELEMENT_TYPES.DATE:
      return <DateDisplay date={answer} data-testid="datedisplay-gd3v" />;
    case PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK:
      return (
        <>
          <Button
            onClick={() => setSurveyLink(answer)}
            variant="contained"
            color="primary"
            data-testid="button-rzll"
            style={{ display: 'inline-block' }}
          >
            <TranslatedText stringId="survey.action.showForm" fallback="Show form" />
          </Button>
          <SurveyResponseDetailsModal
            surveyResponseId={surveyLink}
            onClose={() => setSurveyLink(null)}
            data-testid="surveyresponsedetailsmodal-i1g1"
          />
        </>
      );
    case PROGRAM_DATA_ELEMENT_TYPES.RADIO:
    case PROGRAM_DATA_ELEMENT_TYPES.SELECT:
      return (
        <TranslatedOption
          value={answer}
          referenceDataId={dataElementId}
          referenceDataCategory="programDataElement"
        />
      );
    case PROGRAM_DATA_ELEMENT_TYPES.MULTILINE:
      return <MultilineResult answer={answer} />;
    case PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT:
      return <MultiSelectResult answerBody={answer} dataElementId={dataElementId} />;
    case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA:
      return (
        <PatientDataDisplayField
          value={originalBody}
          config={componentConfig ? JSON.parse(componentConfig) : {}}
        />
      );
    case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE:
      return (
        <AutocompleteCell
          answer={answer}
          componentConfig={componentConfig}
          originalBody={originalBody}
        />
      );
    default:
      return answer;
  }
};
