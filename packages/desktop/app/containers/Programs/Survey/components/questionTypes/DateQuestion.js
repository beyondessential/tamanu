import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { DatepickerGroup } from '../../../../../components';

export class DateQuestion extends Component {
  // onClearDate() {
  //   Alert.alert(
  //     'Clear selected date',
  //     'Are you sure you want to remove the currently selected date for this question?',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       { text: 'Yes', onPress: () => this.props.onChangeAnswer(undefined) },
  //     ],
  //     { cancelable: true },
  //   );
  // }]

  render() {
    const {
      _id, answer, questionText, maximumDate,
    } = this.props;
    const hasAnswer = answer === 0 || !!answer;
    return (
      <DatepickerGroup
        name={`textarea-${_id}`}
        label={false}
        onChange={(date) => this.onDateChange(date)}
        value={hasAnswer ? moment(answer) : moment()}
        maximumDate={maximumDate}
        overwriteClass
        className="field"
      />
    );
  }
}

DateQuestion.propTypes = {
  answer: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChangeAnswer: PropTypes.func.isRequired,
  questionText: PropTypes.string,
  maximumDate: PropTypes.instanceOf(Date),
};

DateQuestion.defaultProps = {
  answer: '',
  questionText: null,
  maximumDate: undefined,
};
