import { connect } from 'react-redux';
import { DumbQuestion } from './components/Question';
import actions from '../../../actions/programs';
import {
  BinaryQuestion,
  CheckboxQuestion,
  // DateQuestion,
  // FreeTextQuestion,
  // GeolocateQuestion,
  Instruction,
  NumberQuestion,
  // PhotoQuestion,
  RadioQuestion,
  UnsupportedQuestion,
  // DaysSinceQuestion,
  // MonthsSinceQuestion,
  // YearsSinceQuestion,
} from './components/questionTypes';

const { survey: surveyActions } = actions;
const { changeAnswer, changeExtraProps, validateComponent } = surveyActions;

const QUESTION_TYPES = {
  Binary: BinaryQuestion,
  Checkbox: CheckboxQuestion,
  // Date: DateQuestion,
  // FreeText: FreeTextQuestion,
  // Geolocate: GeolocateQuestion,
  Instruction,
  Number: NumberQuestion,
  // Photo: PhotoQuestion,
  Radio: RadioQuestion,
  // DaysSince: DaysSinceQuestion,
  // MonthsSince: MonthsSinceQuestion,
  // YearsSince: YearsSinceQuestion,
};

const TYPES_CONTROLLING_QUESTION_TEXT = ['Instruction', 'Checkbox'];

const mapStateToProps = (state, {
  componentIndex,
  screenIndex,
  type,
  text: questionText,
  textInputProps,
}) => {
  const types = ['Instruction', 'Checkbox', 'Radio', 'Binary', 'Number'];
  // console.log('__type__', type, types.includes(type));
  // const { answer, extraProps, validationErrorMessage } = getQuestionState(state, screenIndex, componentIndex);
  return {
    // answer,
    // extraProps,
    textInputProps,
    // validationErrorMessage,
    // hasValidationErrorMessage: !!validationErrorMessage,
    text: questionText,
    SpecificQuestion: QUESTION_TYPES[(types.includes(type) ? type : 'Checkbox')] || UnsupportedQuestion,
  };
};

const mergeProps = ({ hasValidationErrorMessage, ...restOfStateProps }, { dispatch }, ownProps) => {
  const { _id: id, type, screenIndex, componentIndex, validationCriteria } = ownProps;
  return {
    ...ownProps,
    ...restOfStateProps,
    onChangeAnswer: (newAnswer) => {
      dispatch(changeAnswer(id, type, newAnswer));
      // If this question has a validation error message, validate it every time the answer is
      // changed so the user gets immediate feedback when they have fixed the issue
      // if (hasValidationErrorMessage) {
      //   dispatch(validateComponent(screenIndex, componentIndex, validationCriteria, newAnswer));
      // }
    },
    // onChangeExtraProps: (newProps) =>
    //   dispatch(changeExtraProps(id, newProps)),
  };
};

export const Question = connect(
  mapStateToProps,
  null,
  mergeProps,
)(DumbQuestion);
