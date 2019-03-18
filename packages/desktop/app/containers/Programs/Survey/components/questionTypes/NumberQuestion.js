import React from 'react';
import PropTypes from 'prop-types';
import InputGroup from '../../../../../components/InputGroup';

export const NumberQuestion = (props) => {
  const {
    textInputProps, answer, onChangeAnswer, readOnly,
  } = props;

  // label: PropTypes.string.isRequired,
  //   required: PropTypes.bool,
  //   name: PropTypes.string.isRequired,
  //   className: PropTypes.string,
  //   inputClass: PropTypes.string,

  return (
    <InputGroup
      type="number"
      label={false}
      required={false}
      name="some-name"
      className="is-one-third is-paddingless"
      onChange={(e) => onChangeAnswer(e.target.value)}
      value={answer}
      readOnly={readOnly}
    />
  );
};

NumberQuestion.propTypes = {
  textInputProps: PropTypes.object,
  onChangeAnswer: PropTypes.func.isRequired,
};

NumberQuestion.defaultProps = {
  textInputProps: {},
};
