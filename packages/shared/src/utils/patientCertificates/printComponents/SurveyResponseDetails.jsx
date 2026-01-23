import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { useLanguageContext } from '../../pdf/languageContext';
import { useDateTimeFormat } from '../../pdf/withDateTimeContext';

export const SurveyResponseDetails = ({ surveyResponse }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTimeFormat();
  return (
    <DataSection hideTopRule hideBottomRule>
      <Col>
        <DataItem
          label={getTranslation('general.localisedField.clinician.label.short', 'Clinician')}
          value={surveyResponse.submittedBy}
        />
      </Col>
      <Col>
        <DataItem
          label={getTranslation('pdf.surveyResponseDetails.dateOfSubmission', 'Date of submission')}
          value={formatShort(surveyResponse.endTime)}
        />
      </Col>
    </DataSection>
  );
};
