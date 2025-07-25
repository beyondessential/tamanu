import React, { useState } from 'react';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import { useParams } from 'react-router-dom';
import {
  AutocompleteField,
  Field,
  Paper,
  TranslatedReferenceData,
  TranslatedText,
} from '../../components';
import { useApi, useSuggester, combineQueries } from '../../api';
import { SurveyViewForm } from '../../views/programs/SurveyView';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery, useSurveyQuery } from '../../api/queries';
import { getAnswersFromData } from '../../utils';
import { usePatientDataQuery } from '../../api/queries/usePatientDataQuery';
import { Colors } from '../../constants/index.js';

const Container = styled.div`
  margin-bottom: 1.5rem;
`;

const Heading = styled(Typography)`
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  margin-bottom: 10px;
`;

const LeadText = styled(Typography)`
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
  margin-bottom: 10px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const SurveyBox = styled.div`
  background: ${Colors.white};
  padding: 20px;
  margin: 20px 0;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
`;

const SurveyHeading = styled(Typography)`
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 10px;
`;

export const AdditionalData = () => {
  const api = useApi();
  const { patientId } = useParams();
  const { currentUser, facilityId } = useAuth();
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const surveySuggester = useSuggester('survey');
  const [startTime] = useState(getCurrentDateTimeString());
  const {
    data: [patient, patientAdditionalData],
  } = combineQueries([usePatientDataQuery(patientId), usePatientAdditionalDataQuery(patientId)]);
  const { data: survey } = useSurveyQuery(selectedSurveyId);

  const submitSurveyResponse = async data => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      facilityId,
      endTime: getCurrentDateTimeString(),
      answers: getAnswersFromData(data, survey),
    });
  };

  console.log('selectedSurveyId: ', selectedSurveyId);

  const onFormSelect = (event, arg) => {
    console.log('select', event.target.value);
    console.log('select', arg);
    setSelectedSurveyId(event.target.value);
  };

  const onCancel = () => {
    console.log('cancel');
  };

  return (
    <Container>
      <Heading>
        <TranslatedText stringId="procedure.form.addionalDataHeading" fallback=" Additional data" />
      </Heading>
      <LeadText>
        <TranslatedText
          stringId="procedure.form.addionalDataText"
          fallback="Add any additional data to the procedure record by selecting a form below."
        />
      </LeadText>
      <Field
        name="formId"
        label={
          <TranslatedText
            stringId="procedure.form.additionalDataForm.label"
            fallback="Select form"
          />
        }
        component={AutocompleteField}
        suggester={surveySuggester}
        onChange={onFormSelect}
        data-testid="field-87c2z"
      />
      {survey && (
        <SurveyBox>
          <SurveyHeading variant="h6" data-testid="surveypaneheading-b5sc">
            <TranslatedReferenceData category="survey" value={survey.id} fallback={survey.name} />
          </SurveyHeading>
          <SurveyViewForm
            onSubmit={submitSurveyResponse}
            survey={survey}
            onCancel={onCancel}
            patient={patient}
            patientAdditionalData={patientAdditionalData}
            currentUser={currentUser}
          />
        </SurveyBox>
      )}
    </Container>
  );
};
