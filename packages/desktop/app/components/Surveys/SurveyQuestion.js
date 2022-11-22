import React from 'react';
import styled from 'styled-components';
import { getComponentForQuestionType, getConfigObject, mapOptionsToValues } from '../../utils';
import { Field } from '../Field';

const Text = styled.div`
  margin-bottom: 10px;
`;

export const SurveyQuestion = ({ component, patient }) => {
  const {
    dataElement,
    detail,
    config: componentConfig,
    options: componentOptions,
    text: componentText,
  } = component;
  const { defaultText, type, defaultOptions, id } = dataElement;
  const configObject = getConfigObject(id, componentConfig);
  const text = componentText || defaultText;
  const options = mapOptionsToValues(componentOptions || defaultOptions);
  const FieldComponent = getComponentForQuestionType(type, configObject);

  if (!FieldComponent) return <Text>{text}</Text>;

  return (
    <Field
      label={text}
      component={FieldComponent}
      patient={patient}
      name={id}
      options={options}
      config={configObject}
      helperText={detail}
    />
  );
};
