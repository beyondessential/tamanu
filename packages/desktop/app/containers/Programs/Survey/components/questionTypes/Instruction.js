import React from 'react';
import PropTypes from 'prop-types';

const renderDetailText = (detailText) => (
  <label className="question-title has-text-weight-normal is-block is-size-6">
    {detailText}
  </label>
);

const renderQuestionText = (questionText) => (
  <label className="has-text-weight-bold is-block is-size-6">
    {questionText}
  </label>
);

export const Instruction = ({ questionText, detailText, className }) => {
  // Skip rendering of instruction if there is no text to render.
  if (!questionText && !detailText) {
    return null;
  }

  return (
    <div className={className}>
      {(questionText && questionText.length > 0 ? renderQuestionText(questionText) : null)}
      {(detailText && detailText.length > 0 ? renderDetailText(detailText) : null)}
    </div>
  );
};

Instruction.propTypes = {
  questionText: PropTypes.string,
  detailText: PropTypes.string,
};

Instruction.defaultProps = {
  questionText: '',
  detailText: '',
};
