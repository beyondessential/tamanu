import { FormHelperText, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { isErrorUnknownAllow404s, useApi } from '../../api';
import { SurveyAnswerResult } from '../SurveyAnswerResult';

function useLatestAnswerForPatientQuery(patientId, dataElementCode) {
  const api = useApi();
  return useQuery(
    ['surveyResponseAnswer', 'latest-answer', patientId, dataElementCode],
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
  column-gap: 2rem;
  display: grid;
  grid-template-columns: 1fr auto;
  margin-block-end: 10px;
`;

export const SurveyAnswerField = ({
  className,
  config,
  dataElement,
  error,
  field,
  form,
  helperText,
  label,
  patient,
}) => {
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
  }, [answer, field.name, form?.setFieldValue]);

  const sourceType = answer?.ProgramDataElement?.type;
  const sourceConfig = answer?.ProgramDataElement?.surveyScreenComponent?.config;
  const sourceBody = answer?.body;

  return (
    <Container className={className} data-testid="container-xmfz">
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
      {helperText && <FormHelperText error={Boolean(error)}>{helperText}</FormHelperText>}
    </Container>
  );
};
