import React, { useState } from 'react';
import { camelCase } from 'lodash';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { SurveyResultBadge } from './SurveyResultBadge';
import { ViewPhotoLink } from './ViewPhotoLink';
import { DateDisplay } from './DateDisplay';
import { Button } from './Button';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { TranslatedReferenceData } from './Translation/index.js';
import { TranslatedText } from './Translation/TranslatedText';
import { TranslatedOption } from './Translation/TranslatedOptions.jsx';

const getReferenceDataCategory = configString => {
  try {
    const config = JSON.parse(configString);
    return camelCase(config.source === 'ReferenceData' ? config.where.type : config.source);
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

export const SurveyAnswerResult = ({
  answer,
  type,
  sourceType,
  originalBody,
  componentConfig,
  dataElementId,
}) => {
  console.log({ answer, type, sourceType, originalBody, componentConfig, dataElementId });

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
            <TranslatedText
              stringId="survey.action.showForm"
              fallback="Show Form"
              data-testid="translatedtext-show-form"
            />
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
    case PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT:
      return JSON.parse(answer).map(element => (
        <>
          <TranslatedOption
            value={element}
            referenceDataId={dataElementId}
            referenceDataCategory="programDataElement"
          />
          <br />
        </>
      ));
    case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA:
    case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE:
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
