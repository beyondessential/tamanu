import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { formatShort } from '../../dateTime';

export const SurveyResponseDetails = ({ surveyResponse }) => {
  return (
    <DataSection hideTopRule hideBottomRule>
      <Col>
        <DataItem label="Clinician" value={surveyResponse.submittedBy} />
      </Col>
      <Col>
        <DataItem label="Date of submission" value={formatShort(surveyResponse.endTime)} />
      </Col>
    </DataSection>
  );
};
