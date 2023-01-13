import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getComponentForQuestionType, getConfigObject, mapOptionsToValues } from '../../utils';
import { Field } from '../Field';

const Text = styled.div`
  margin-bottom: 10px;
`;

export const SurveyQuestion = ({ component, patient, errors }) => {
  const {
    dataElement,
    detail,
    config: componentConfig,
    options: componentOptions,
    text: componentText,
    validationCriteria,
  } = component;
  const [questionRef, setQuestionRef] = useState(null);
  const { defaultText, type, defaultOptions, id } = dataElement;
  const configObject = getConfigObject(id, componentConfig);
  const text = componentText || defaultText;
  const options = mapOptionsToValues(componentOptions || defaultOptions);
  const FieldComponent = getComponentForQuestionType(type, configObject);

  const validationCriteriaObject = getConfigObject(id, validationCriteria);
  const required = validationCriteriaObject?.mandatory || null;

  useEffect(() => {
    // if (isValid || !isSubmitting) return;
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey === id) {
      console.log('-- match --', firstErrorKey, id, questionRef);
      questionRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  if (!FieldComponent) return <Text>{text}</Text>;

  return (
    <Field
      inputRef={node => {
        if (node !== null) {
          // console.log('node', node);
          setQuestionRef(node);
        }
      }}
      label={text}
      component={FieldComponent}
      patient={patient}
      name={id}
      options={options}
      config={configObject}
      helperText={detail}
      required={required}
    />
  );
};
