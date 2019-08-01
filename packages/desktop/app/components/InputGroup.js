import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

export default class InputGroupNew extends Component {
  static propTypes = {
    type: PropTypes.string,
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    labelClass: PropTypes.string,
    inputClass: PropTypes.string,
    overwriteClass: PropTypes.bool,
    autoFocus: PropTypes.bool,
    note: PropTypes.string,
  };

  static defaultProps = {
    type: 'text',
    required: false,
    className: 'field column',
    labelClass: 'label',
    inputClass: 'control',
    overwriteClass: false,
    autoFocus: false,
    note: '',
  };

  constructor(props) {
    super(props);
    this.state = { value: props.value ? props.value : '' };
  }

  componentWillReceiveProps(newProps) {
    this.setState({ value: newProps.value ? newProps.value : '' });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
    if (this.props.onChange) this.props.onChange(event);
  }

  render() {
    const {
      type,
      label,
      required,
      name,
      tabIndex,
      overwriteClass,
      inputClass,
      labelClass,
      readOnly,
      autoFocus,
      note,
      placeholder,
    } = this.props;
    let { className } = this.props;
    if (!overwriteClass) className = `field ${className}`;

    return (
      <div className={className}>
        {label !== false && (
          <label className={labelClass}>
            {label} {required && <span className="isRequired">*</span>}
          </label>
        )}
        <div className={inputClass}>
          <input
            className="input"
            type={type}
            name={name}
            tabIndex={tabIndex}
            value={this.state.value}
            onChange={this.handleChange.bind(this)}
            required={required}
            readOnly={readOnly}
            autoFocus={autoFocus}
            placeholder={placeholder}
          />
        </div>
        {note && <p className="help">{note}</p>}
      </div>
    );
  }
}
