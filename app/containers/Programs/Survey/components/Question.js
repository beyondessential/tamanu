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
    const { _id: key, imageData, text, type, SpecificQuestion, validationErrorMessage, ...questionProps } = this.props;
    // console.log('__questionProps__', questionProps);
    return (
      <div className="column is-half questions-one">
        {text && <Instruction questionText={text} detailText={questionProps.detail} />}
        {/* {imageData && imageData.length > 0 ? (<Image
          source={getImageSourceFromData(imageData)}
          style={localStyles.image}
        />) : null} */}
        {type !== 'Instruction' &&
          <div className="question-details">
            <SpecificQuestion
              key={key}
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
