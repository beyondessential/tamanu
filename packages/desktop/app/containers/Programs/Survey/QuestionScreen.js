import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { find } from 'lodash';
import { Question } from './Question';

class QuestionScreen extends React.Component {
  constructor(props) {
    super(props);
    this.textInputRefs = {};
    this.getAnswer = this.getAnswer.bind(this);
  }

  getAnswer(questionId) {
    const { answers } = this.props;
    const answer = find(answers, (_answer => _answer.questionId === questionId));
    return (answer && answer.body) || '';
  }

  // shouldComponentUpdate(nextProps) {
  //   const currentQuestions = this.props.questions;
  //   const nextQuestions = nextProps.questions;
  //   if (currentQuestions.length !== nextQuestions.length ||
  //       currentQuestions.some((question, index) => question.id !== nextQuestions[index].id)) {
  //     return true;
  //   }
  //   return false;
  // }

  render() {
    const { questions, screenIndex, readOnly } = this.props;
    return questions.map((questionModel) => {
      const question = questionModel.toJSON();
      return (
        <Question
          key={question._id}
          screenIndex={screenIndex}
          answer={this.getAnswer(question._id)}
          readOnly={readOnly}
          singleLine={questionModel.isSingleLine()}
          {...question}
        />
      );
    });
  }
}

QuestionScreen.propTypes = {
  questions: PropTypes.array.isRequired,
  screenIndex: PropTypes.number.isRequired,
  answers: PropTypes.array,
  readOnly: PropTypes.bool
};

QuestionScreen.defaultProps = {
  answers: [],
  readOnly: false
};

const mapStateToProps = (state, { surveyModel, screenIndex }) => {
  return { questions: surveyModel.getQuestions(screenIndex) };
};

export default connect(mapStateToProps, undefined)(QuestionScreen);
