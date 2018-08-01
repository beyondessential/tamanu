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
    const { mageData, text, type, SpecificQuestion, validationErrorMessage, singleLine, ...questionProps } = this.props;
    let wrapperClass = '';
    let questionClass = '';
    let labelClass = 'm-b-10';
    switch (type) {
      case 'Binary':
      case 'Radio':
        wrapperClass = `${singleLine ? 'columns' : 'column is-half'}`;
        questionClass = `${singleLine ? 'column' : ''} question-details`;
        labelClass = `${singleLine ? 'column is-narrow-desktop m-l-10' : 'm-b-10'}`;
        break;
      case 'Number':
        wrapperClass = `${singleLine ? 'columns' : 'column is-half'}`;
        questionClass = `${singleLine ? 'column is-one-third' : ''} question-details`;
        labelClass = `${singleLine ? 'column is-narrow-desktop m-l-10 p-t-15' : 'm-b-10'}`;
        break;
      case 'Instruction':
        wrapperClass = '';
        break;
      default:
        wrapperClass = 'column is-half';
        questionClass = 'question-details';
        break;
    }

    return (
      <div className={wrapperClass}>
        {text && <Instruction questionText={`${text}:`} detailText={questionProps.detail} className={labelClass} />}
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
