import React from 'react';
import PropTypes from 'prop-types';
import { Instruction } from './questionTypes/Instruction';

export class DumbQuestion extends React.Component {
  // shouldComponentUpdate(nextProps) {
  //   if (this.props.answer === nextProps.answer &&
  //       this.props.validationErrorMessage === nextProps.validationErrorMessage) {
  //     return false;
  //   }
  //   return true;
  // }

  render() {
    const { mageData, text, type, SpecificQuestion, validationErrorMessage, ...questionProps } = this.props;
    let wrapperClass = '';
    let questionClass = '';
    let labelClass = 'm-b-10';
    switch (type) {
      case 'Number':
        wrapperClass = 'column is-half';
        questionClass = '_column question-details';
        labelClass = '_column m-b-10';
        break;
      case 'Instruction':
        wrapperClass = '';
        break;
      default:
        wrapperClass = 'column is-half';
        questionClass = 'question-details';
        break;
    }
    // console.log('__questionProps__', questionProps);
    return (
      <div className={wrapperClass}>
        {text && <Instruction questionText={text} detailText={questionProps.detail} className={labelClass} />}
        {/* {imageData && imageData.length > 0 ? (<Image
          source={getImageSourceFromData(imageData)}
          style={localStyles.image}
        />) : null} */}
        {type !== 'Instruction' &&
          <div className={questionClass}>
            <SpecificQuestion
              key={questionProps._id}
              questionText={text}
              {...questionProps}
            />
          </div>
        }
        {/* {validationErrorMessage && <StatusMessage type={STATUS_MESSAGE_ERROR} message={validationErrorMessage} />} */}
      </div>
    );
  }
}

DumbQuestion.propTypes = {
  detailText: PropTypes.string,
  imageData: PropTypes.string,
  text: PropTypes.string,
  validationErrorMessage: PropTypes.string,
  SpecificQuestion: PropTypes.any.isRequired,
};

DumbQuestion.defaultProps = {
  detailText: null,
  imageData: null,
  text: null,
  validationErrorMessage: null,
};
