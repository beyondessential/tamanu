import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { kebabCase } from 'lodash';

class CheckboxGroup extends Component {
  static propTypes = {
    type: PropTypes.string,
    label: PropTypes.any.isRequired,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    labelClass: PropTypes.string,
    overwriteClass: PropTypes.bool,
    note: PropTypes.string,
  };

  static defaultProps = {
    type: 'checkbox',
    className: 'field column',
    labelClass: 'label',
    overwriteClass: false,
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
      name,
      tabIndex,
      overwriteClass,
      labelClass,
      readOnly,
      note,
      ...others
    } = this.props;
    const fieldId = kebabCase(`${type}-${name}-${new Date().getTime()}`);
    let { className } = this.props;
    if (!overwriteClass) className = `field ${className}`;
    delete others.className;

    return (
      <div className={className}>
        <label className={labelClass} htmlFor={fieldId}>
          <input
            id={fieldId}
            className="m-r-5"
            type={type}
            name={name}
            tabIndex={tabIndex}
            value={this.state.value}
            onChange={this.handleChange.bind(this)}
            readOnly={readOnly}
            {...others}
          />
          {label}
        </label>
        {note && <p className="help">{note}</p>}
      </div>
    );
  }
}

export default connect(
  null,
  {},
)(CheckboxGroup);
