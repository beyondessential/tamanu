import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Question } from './Question';

class QuestionScreen extends React.Component {
  constructor(props) {
    super(props);
    this.textInputRefs = {};
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
    const { questions, screenIndex } = this.props;
    return questions.map((question, index) => {
      // console.log('__question__', question);
      return <Question key={question._id} screenIndex={screenIndex} {...question} />;
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
};

const mapStateToProps = (state, { model, screenIndex }) => {
  return { questions: model.getQuestions(screenIndex) };
};

export default connect(mapStateToProps, undefined)(QuestionScreen);
