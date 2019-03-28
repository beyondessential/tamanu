import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TextareaGroup } from '../../../../../components';

export class FreeTextQuestion extends Component {
  render() {
    const {
      _id,
      answer,
      onChangeAnswer,
      textInputProps,
    } = this.props;

    const {
      onSubmitEditing,
      ...restOfTextInputProps
    } = textInputProps;

    return (
      <TextareaGroup
        name={`textarea-${_id}`}
        label={false}
        value={answer}
        selectTextOnFocus
        onChange={(e) => onChangeAnswer(e.target.value)}
        {...restOfTextInputProps}
      />
    );
  }
}

FreeTextQuestion.propTypes = {
  answer: PropTypes.string,
  onChangeAnswer: PropTypes.func.isRequired,
  textInputProps: PropTypes.object,
};

FreeTextQuestion.defaultProps = {
  answer: '',
  textInputProps: {},
};
