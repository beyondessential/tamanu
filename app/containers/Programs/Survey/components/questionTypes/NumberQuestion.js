import React from 'react';
import PropTypes from 'prop-types';
import InputGroup from '../../../../../components/InputGroup';

export const NumberQuestion = (props) => {
  const { textInputProps, ...otherProps } = props;

  // label: PropTypes.string.isRequired,
  //   required: PropTypes.bool,
  //   name: PropTypes.string.isRequired,
  //   className: PropTypes.string,
  //   inputClass: PropTypes.string,

  return (
    <InputGroup
      label={false}
      required={false}
      name="some-name"
      className="is-one-third is-paddingless"
    />
  );
};

NumberQuestion.propTypes = {
  textInputProps: PropTypes.object,
};

NumberQuestion.defaultProps = {
  textInputProps: {},
};
