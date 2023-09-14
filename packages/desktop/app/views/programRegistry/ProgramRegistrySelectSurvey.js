import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { useSuggester } from '../../api';
import { Colors, PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { Heading3 } from '../../components/Typography';
import { Button } from '../../components/Button';
import { Form, Field, AutocompleteField } from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { foreignKey } from '../../utils/validation';

const DisplayContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  border: 1px solid ${Colors.softOutline};
  font-size: 11px;
  padding: 10px;
  background-color: ${Colors.white};
`;

const StyledFormGrid = styled(FormGrid)`
  width: 100%;
  display: grid;
  grid-template-columns: 80% 18%;
  width: 100%;
  justify-content: space-between;
  align-items: flex-end;
`;

export const ProgramRegistrySelectSurvey = ({ patientProgramRegistration }) => {
  const programRegistrySurveySuggester = useSuggester('survey', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.id },
  });
  return (
    <DisplayContainer>
      <Heading3>Select a {patientProgramRegistration.name} form below to complete</Heading3>
      <Form
        style={{ width: '100%', marginTop: '5px' }}
        onSubmit={() => {
          // console.log({ ...data, patientId: patient.id });
        }}
        render={value => {
          // console.log(value);
          return (
            <StyledFormGrid>
              <Field
                name="surveyId"
                label="Select form"
                component={AutocompleteField}
                suggester={programRegistrySurveySuggester}
                disabled={
                  patientProgramRegistration.registrationStatus ===
                  PROGRAM_REGISTRATION_STATUSES.REMOVED
                }
              />

              <Button
                variant="contained"
                style={{ height: '44px' }}
                onClick={() => {
                  // console.log('clicked');
                }}
                disabled={
                  patientProgramRegistration.registrationStatus ===
                    PROGRAM_REGISTRATION_STATUSES.REMOVED || !value.values.surveyId
                }
              >
                Begin form
              </Button>
            </StyledFormGrid>
          );
        }}
        validationSchema={yup.object().shape({
          surveyId: foreignKey('A form must be selected'),
        })}
      />
    </DisplayContainer>
  );
};
