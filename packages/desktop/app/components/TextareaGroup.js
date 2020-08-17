import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import shortid from 'shortid';

export default class TextareaGroup extends Component {
  static propTypes = {
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    labelClass: PropTypes.string,
  };

  static defaultProps = {
    required: false,
    className: 'field column',
    labelClass: 'label',
  };

  constructor(props) {
    super(props);
    this.state = { value: props.value ? props.value : '' };
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({ value: newProps.value ? newProps.value : '' });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
    if (this.props.onChange) this.props.onChange(event);
  }

  render() {
    const { label, required, name, tabIndex, labelClass, className } = this.props;
    const fiedlId = `textarea-${shortid.generate()}`;
    return (
      <div className={className}>
        {label && (
          <label className={labelClass} htmlFor={fiedlId}>
            {label} {required && <span className="isRequired">*</span>}
          </label>
        )}
        <div className="control">
          <textarea
            id={fiedlId}
            className="textarea is-primary"
            name={name}
            rows="3"
            tabIndex={tabIndex}
            value={this.state.value}
            onChange={this.handleChange.bind(this)}
            required={required}
          />
        </div>
      </div>
    );
  }
}
