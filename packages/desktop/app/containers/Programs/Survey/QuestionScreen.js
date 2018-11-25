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
    const { questions, screenIndex, answers, readOnly } = this.props;
    console.log('-questions-', questions);
    return questions.map((model, index) => {
      const question = model.toJSON();
      return (
        <Question
          key={question._id}
          screenIndex={screenIndex}
          answer={this.getAnswer(question._id)}
          readOnly={readOnly}
          singleLine={model.isSingleLine()}
          {...question}
        />
      );
      // if (!TABBABLE_QUESTION_TYPES.includes(question.type)) {
      // }
      // const nextQuestionIsTabbable = index + 1 < questions.length &&
      //   TABBABLE_QUESTION_TYPES.includes(questions[index + 1].type);
      // return (
      //   <Question
      //     key={question.id}
      //     screenIndex={screenIndex}
      //     {...question}
      //     textInputProps={{
      //       inputRef: (textInputRef) => { this.textInputRefs[question.id] = textInputRef; },
      //       onSubmitEditing: () => {
      //         if (nextQuestionIsTabbable) {
      //           this.textInputRefs[questions[index + 1].id].focus();
      //         }
      //       },
      //       returnKeyType: nextQuestionIsTabbable ? 'next' : 'done',
      //     }}
      //   />
      // );
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

const mapStateToProps = (state, { model, screenIndex }) => {
  return { questions: model.getQuestions(screenIndex) };
};

export default connect(mapStateToProps, undefined)(QuestionScreen);
