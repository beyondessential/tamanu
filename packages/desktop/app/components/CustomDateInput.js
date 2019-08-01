import React, { Component } from 'react';
import PropTypes from 'prop-types';

class CustomDateInput extends Component {
  render() {
    const { styleName, onClick, value } = this.props;
    return (
      <div className={styleName} onClick={onClick}>
        {value}
      </div>
    );
  }
}

CustomDateInput.propTypes = {
  onClick: PropTypes.func,
  styleName: PropTypes.string,
};

CustomDateInput.defaultProps = {
  onClick: () => {},
  styleName: 'input custom-date-input',
};

export default CustomDateInput;
