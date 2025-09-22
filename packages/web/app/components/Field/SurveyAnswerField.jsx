import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLatestAnswerForPatientQuery } from '../../api/queries/useLatestAnswerForPatientQuery';
import { SurveyAnswerResult } from '../SurveyAnswerResult';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 10px;
`;

export const SurveyAnswerField = ({ config, label, patient, field, form, dataElement }) => {
  const [surveyResponseAnswer, setSurveyResponseAnswer] = useState('');

  const { data: answer } = useLatestAnswerForPatientQuery(
    patient.id,
    config?.source || config?.Source,
  );

  useEffect(() => {
    if (!answer) return;

    if (field.name && answer?.body) {
      form?.setFieldValue(field.name, answer?.body);
    }

    setSurveyResponseAnswer(answer?.displayAnswer || answer?.body || '');
  }, [field.name, answer]);

  const [sourceType, sourceConfig, sourceBody] = [
    answer?.ProgramDataElement?.type,
    answer?.ProgramDataElement?.surveyScreenComponent?.config,
    answer?.body,
  ];

  return (
    <Container data-testid="container-xmfz">
      <div>{label}</div>
      <div>
        <SurveyAnswerResult
          answer={surveyResponseAnswer}
          type={sourceType}
          data-testid="surveyanswerresult-m2ey"
          originalBody={sourceBody}
          componentConfig={sourceConfig}
          dataElementId={dataElement?.id}
        />
      </div>
    </Container>
  );
};
