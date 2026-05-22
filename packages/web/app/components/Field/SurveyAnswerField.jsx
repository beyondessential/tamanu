import { Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useId, useState } from 'react';
import styled from 'styled-components';

import { isErrorUnknownAllow404s, useApi } from '../../api';
import { SurveyAnswerResult } from '../SurveyAnswerResult';

function useLatestAnswerForPatientQuery(patientId, dataElementCode) {
  const api = useApi();
  return useQuery(
    ['survey', patientId, dataElementCode],
    async () =>
      await api.get(
        `surveyResponseAnswer/latest-answer/${encodeURIComponent(dataElementCode)}`,
        { patientId },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      enabled: Boolean(patientId && dataElementCode),
    },
  );
}

const Container = styled.div`
  align-items: baseline;
  display: flex;
  gap: 2rem;
  justify-content: space-between;
  margin-block-end: 10px;
`;

export const SurveyAnswerField = ({ config, label, patient, field, form, dataElement }) => {
  const [surveyResponseAnswer, setSurveyResponseAnswer] = useState('');
  const outputId = useId();

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
  }, [answer, field.name, form?.setFieldValue]);

  const sourceType = answer?.ProgramDataElement?.type;
  const sourceConfig = answer?.ProgramDataElement?.surveyScreenComponent?.config;
  const sourceBody = answer?.body;

  return (
    <Container data-testid="container-xmfz">
      <Typography component="h2" variant="body1">
        {label}
      </Typography>
      <SurveyAnswerResult
        answer={surveyResponseAnswer}
        componentConfig={sourceConfig}
        data-testid="surveyanswerresult-m2ey"
        dataElementId={dataElement?.id}
        originalBody={sourceBody}
        type={sourceType}
      />
    </Container>
  );
};
