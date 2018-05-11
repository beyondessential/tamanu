import React, { Component } from 'react';

class CustomDateInput extends Component {
  render() {
    return (
      <div
        className="custom-date-input"
        onClick={this.props.onClick}
      >
        {this.props.value}
      </div>
    );
  }
}

export default CustomDateInput;
