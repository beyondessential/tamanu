import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DatepickerGroup from './DatepickerGroup';

const groupStyle = {
  display: 'flex',
  width: '20em',
};

export class DateRange extends Component {
  updateStart = start => this.updateValue({ start });

  updateEnd = end => this.updateValue({ end });

  updateValue(newValue) {
    const { onChange, value } = this.props;
    const updatedValue = { ...value, ...newValue };
    if (onChange) {
      onChange(updatedValue);
    }
  }

  render() {
    const { name, value } = this.props;

    return (
      <div style={groupStyle}>
        <DatepickerGroup
          name={`${name}-start`}
          label="Start date"
          value={value.start}
          onChange={this.updateStart}
        />
        <DatepickerGroup
          name={`${name}-end`}
          label="End date"
          value={value.end}
          onChange={this.updateEnd}
        />
      </div>
    );
  }
}
