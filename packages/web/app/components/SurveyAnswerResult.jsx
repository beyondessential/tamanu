import React, { useState } from 'react';
import { camelCase } from 'lodash';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { SurveyResultBadge } from './SurveyResultBadge';
import { ViewPhotoLink } from './ViewPhotoLink';
import { DateDisplay } from './DateDisplay';
import { Button } from './Button';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { TranslatedReferenceData } from './Translation/index.js';

const getReferenceDataCategory = configString => {
  try {
    const config = JSON.parse(configString);
    return camelCase(config.source);
  } catch (e) {
    return null;
  }
};

const PatientDataCell = ({ answer, originalBody, componentConfig }) => {
  const category = getReferenceDataCategory(componentConfig);

  if (!category) {
    return answer;
  }

  return <TranslatedReferenceData fallback={answer} value={originalBody} category={category} />;
};

export const SurveyAnswerResult = ({ answer, type, sourceType, originalBody, componentConfig }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [surveyLink, setSurveyLink] = useState(null);

  if (!answer) return 'Answer not submitted';

  switch (sourceType || type) {
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
          >
            Show Form
          </Button>
          <SurveyResponseDetailsModal
            surveyResponseId={surveyLink}
            onClose={() => setSurveyLink(null)}
            data-testid="surveyresponsedetailsmodal-i1g1"
          />
        </>
      );
    case PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT:
      return JSON.parse(answer).map((element) => (
        <>
          {element}
          <br />
        </>
      ));
    case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA:
      return (
        <PatientDataCell
          answer={answer}
          componentConfig={componentConfig}
          originalBody={originalBody}
        />
      );
    default:
      return answer;
  }
};
