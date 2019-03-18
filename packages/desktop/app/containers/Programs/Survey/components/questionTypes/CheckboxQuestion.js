import React from 'react';
import PropTypes from 'prop-types';

export const CheckboxQuestion = ({ answer, onChangeAnswer, questionText }) => (
  <div key={questionText}>
    <label className="checkbox">
      <input type="checkbox" name="secondaryDiagnosis" checked={answer === 'Yes'} />
      <span>
        {' '}
        {questionText}
      </span>
    </label>
  </div>
  // <input type="checkbox" />
  // <Checkbox
  //   key={questionText}
  //   labelSide="left"
  //   labelText={questionText}
  //   isChecked={answer === 'Yes'}
  //   onToggle={() => onChangeAnswer(answer === 'Yes' ? 'No' : 'Yes')}
  // />
);

CheckboxQuestion.propTypes = {
  answer: PropTypes.string,
  onChangeAnswer: PropTypes.func.isRequired,
  questionText: PropTypes.string.isRequired,
};

CheckboxQuestion.defaultProps = {
  answer: 'No',
};
