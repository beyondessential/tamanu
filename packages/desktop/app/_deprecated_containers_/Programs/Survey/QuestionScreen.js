import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { find } from 'lodash';
import { Question } from './Question';
import actions from '../../../actions/programs';

class QuestionScreen extends React.Component {
  constructor(props) {
    super(props);
    this.textInputRefs = {};
    this.getAnswer = this.getAnswer.bind(this);
  }

  getAnswer(questionId) {
    const { answers } = this.props;
    const answer = find(answers, _answer => _answer.questionId === questionId);
    if (answer && answer.newAnswer) return answer.newAnswer;
    if (answer && answer.body) return answer.body;
    return '';
  }

  answerChanged = event => {
    const { changeAnswer } = this.props;
    const { name, value } = event.target;
    changeAnswer(name, 'Radio', value);
  };

  render() {
    const { questions, screenIndex, readOnly } = this.props;
    return questions.map(questionModel => {
      const question = questionModel.toJSON();
      return (
        <Grid item xs>
          <Question
            key={question._id}
            screenIndex={screenIndex}
            answer={this.getAnswer(question._id)}
            readOnly={readOnly}
            singleLine={questionModel.isSingleLine()}
            onChange={this.answerChanged}
            {...question}
          />
        </Grid>
      );
    });
  }
}

QuestionScreen.propTypes = {
  questions: PropTypes.arrayOf(Object).isRequired,
  screenIndex: PropTypes.number.isRequired,
  answers: PropTypes.arrayOf(Object),
  readOnly: PropTypes.bool,
};

QuestionScreen.defaultProps = {
  answers: [],
  readOnly: false,
};

const mapStateToProps = ({ programs: { answers } }, { surveyModel, screenIndex, readOnly }) => {
  const mappedProps = { questions: surveyModel.getQuestions(screenIndex) };
  if (!readOnly) mappedProps.answers = answers;
  return mappedProps;
};

const {
  survey: { changeAnswer },
} = actions;
const mapDispatchToProps = dispatch => ({
  changeAnswer: (...props) => dispatch(changeAnswer(...props)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(QuestionScreen);
