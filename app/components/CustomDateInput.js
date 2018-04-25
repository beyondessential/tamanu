import React, { Component } from 'react';
import { PropTypes } from 'prop-types';

class CustomDateInput extends Component {
  render() {
    return (
      <button
        className="custom-date-input"
        onClick={this.props.onClick}
      >
        {this.props.value}
      </button>
    );
  }
}

CustomDateInput.propTypes = {
  onClick: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

export default CustomDateInput;
