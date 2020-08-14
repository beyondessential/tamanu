import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Select from 'react-select';
import { head, isEmpty } from 'lodash';
import shortid from 'shortid';

export default class SelectGroup extends Component {
  static propTypes = {
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    labelClass: PropTypes.string,
    value: PropTypes.any,
    onBlurResetsInput: PropTypes.bool,
    onSelectResetsInput: PropTypes.bool,
    clearable: PropTypes.bool,
    simpleValue: PropTypes.bool,
    searchable: PropTypes.bool,
    showDefault: PropTypes.bool,
  };

  static defaultProps = {
    required: false,
    className: '',
    labelClass: 'label',
    value: '',
    onBlurResetsInput: false,
    onSelectResetsInput: false,
    clearable: false,
    simpleValue: true,
    searchable: false,
    showDefault: true,
  };

  componentWillMount() {
    this.parseValue(this.props, true);
  }

  componentWillReceiveProps(newProps) {
    this.parseValue(newProps);
  }

  parseValue(props) {
    const { options, showDefault } = props;

    // Set default value
    let { value } = props;
    if (showDefault && value === '' && !isEmpty(options)) {
      const { value: firstValue } = head(options);
      value = firstValue;
    }
    this.setState({ value });
  }

  handleChange(value) {
    const { name } = this.props;
    this.setState({ value });
    if (this.props.onChange) this.props.onChange(value, name);
  }

  render() {
    const {
      label,
      required,
      name,
      tabIndex,
      options,
      disabled,
      className,
      labelClass,
      onChange,
      defaultValue,
      ...others
    } = this.props;
    const { value } = this.state;
    delete others.value;
    const selectMenuId = `select-${shortid.generate()}`;

    return (
      <div className={className}>
        {label !== false && (
          <label className={labelClass} htmlFor={selectMenuId}>
            {label} {required && <span className="isRequired">*</span>}
          </label>
        )}
        <Select
          id={selectMenuId}
          name={name}
          tabIndex={tabIndex}
          options={options}
          disabled={disabled}
          value={value}
          onChange={this.handleChange.bind(this)}
          {...others}
        />
      </div>
    );
  }
}
