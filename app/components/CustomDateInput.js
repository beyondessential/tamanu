import React, { Component } from 'react';

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

export default CustomDateInput;
