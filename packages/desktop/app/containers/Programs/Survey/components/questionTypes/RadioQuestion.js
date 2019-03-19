import React from 'react';
import PropTypes from 'prop-types';

export const RadioQuestion = ({
  _id: id, answer, onChangeAnswer, options, readOnly, stacked,
}) => (
  <div className="control is-size-6">
    {options.map((option) => {
      const { label, value } = extractOptionDetails(option); // Sometimes an object with defined color/label/value
      const isChecked = answer === value;
      const className = `radio ${stacked ? 'is-block-inline m-r-15' : 'is-block'} m-b-5 m-l-0`;
      return (
        <label className={className} key={value}>
          <input
            className="m-r-2"
            type="radio"
            name={`radio_${id}`}
            value={value}
            defaultChecked={isChecked}
            onChange={({ target }) => onChangeAnswer(target.value)}
            disabled={readOnly && !isChecked}
          />
          {' '}
          {label}
        </label>
      );
    })}
  </div>
);

RadioQuestion.propTypes = {
  answer: PropTypes.string,
  options: PropTypes.array.isRequired,
  onChangeAnswer: PropTypes.func.isRequired,
  stacked: PropTypes.bool,
};

RadioQuestion.defaultProps = {
  answer: '',
  stacked: false,
};

/**
 * Options can either be defined as simple strings, which will be used as both their label and
 * value, or as a string of JSON that separately defines the label and value, and optionally the
 * color it is presented in
 */
const extractOptionDetails = (optionString) => {
  let optionObject;
  try {
    // If it can be parsed into a JSON object, do so and extract the pre-configured label,
    // value, and optional color
    optionObject = JSON.parse(optionString);
    if (!optionObject.value) { // Valid JSON but not a valid option object, e.g. '50'
      throw new Error('Options defined as an object must contain the value key at minimum');
    }
  } catch (error) {
    // This is not a valid JSON object, just use the string itself as the value and label
    optionObject = { value: optionString, label: optionString };
  }
  return optionObject;
};
