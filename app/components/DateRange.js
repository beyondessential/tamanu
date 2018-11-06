import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DatepickerGroup from './DatepickerGroup';

const groupStyle = {
  display: 'flex',
};

export class DateRange extends Component {

  state = {
    start: null,
    end: null,
  }

  updateStart = (start) => this.updateValue({ start })
  updateEnd = (end) => this.updateValue({ end })

  updateValue(newValue) {
    const { onChange } = this.props;
    const updatedValue = { ...this.state, ...newValue };
    this.setState(updatedValue);
    if(onChange) {
      onChange(updatedValue);
    }
  }

  render() {
    const { name } = this.props;

    return (
      <div style={ groupStyle }>
        <DatepickerGroup 
          name={ `${name}-start` } 
          label="Start date"
          value={ this.state.start }
          onChange={ this.updateStart }
        />
        <DatepickerGroup 
          name={ `${name}-end` } 
          label="End date" 
          value={ this.state.end }
          onChange={ this.updateEnd }
        />
      </div>
    );
  }
}
