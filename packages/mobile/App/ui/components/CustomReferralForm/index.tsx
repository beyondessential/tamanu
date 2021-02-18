import React, { useEffect, useState } from 'react';
import { Formik } from 'formik';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';

import { FullView, StyledView } from '/styled/common';
import { Text } from 'react-native-paper';
import { useBackend } from '~/ui/hooks';
import { Field } from '../Forms/FormField';
import { FieldByType } from '~/ui/helpers/fieldComponents';
import { FieldTypes } from '~/ui/helpers/fields';
import { Title } from 'react-native-paper';
import { Button } from '../Button';
import { SurveyAnswerField } from './SurveyAnswerField';

function getField(type: string): FC<any> {
  const field = FieldByType[type];
  if(field || field === null) return field;

  return () => <Text>{`No field type ${type}`}</Text>;
}

const ReferralQuestion = ({ data, patientData }) => {
  const {question, field, options, type, source, id} = data;
  const fieldInput: React.FC<any> = getField(field);
  if(!fieldInput) return null;
  const isMultiline = field === FieldTypes.MULTILINE;

  switch (type) {
    case 'input':
      return (
        <StyledView marginTop={10}>
          <Field
            component={fieldInput}
            name={id}
            label={question}
            // options={options && && component.getOptions()} // TODO: transform from CSV string to list of options
            multiline={isMultiline}
          />
        </StyledView>
      );
    case 'survey':
      return (
        <StyledView marginTop={10}>
          <SurveyAnswerField
            data={data}
          />
        </StyledView>
      );
    case 'patient':
      return (
        <StyledView marginTop={10}>
          <Field
            component={fieldInput}
            name={id}
            label={question}
            value={patientData[source] || ''}
            disabled
          />
        </StyledView>
      );
    default:
      <Text>{`Could not create question of type: ${type}`}</Text>
      break;
  }
}

const CustomReferralFormComponent = ({ selectedForm, selectedPatient }) => {
 const [questions, setQuestions] = useState([]);
 const [title, setTitle] = useState();
 const [isLoading, setIsLoading] = useState(true);
 const { models } = useBackend();

   useEffect(() => {
    (async (): Promise<void> => {
      setIsLoading(true);
      const form = await models.ReferralForm.getRepository().findOne(selectedForm);
      const formQuestions = await models.ReferralForm.getQuestions(selectedForm);
      setTitle(form.title);
      setQuestions(formQuestions);
      setIsLoading(false);
    })();
  }, [selectedForm]);

  if (isLoading) {
    <FullView>
      <Text>Loading...</Text>
    </FullView>
  }

  return (
    <FullView>
        <Formik
          initialValues={{}}
          onSubmit={val => console.log('submitting form with: ', val)}
        >
          {({ handleSubmit }): JSX.Element => (
            <FullView padding={12}>
              <Title>{title}</Title>
              {questions.map(q => <ReferralQuestion patientData={selectedPatient} data={q} />)}
              <Button marginTop={12} onPress={handleSubmit} buttonText="Submit" />
            </FullView>
          )}
        </Formik>
    </FullView>
  );
}

export const CustomReferralForm = compose(withPatient)(CustomReferralFormComponent);