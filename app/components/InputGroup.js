import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class InputGroup extends Component {
  static propTypes = {
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    inputClass: PropTypes.string,
    overwriteClass: PropTypes.bool,
    autoFocus: PropTypes.bool,
  }

  static defaultProps = {
    required: false,
    className: '',
    inputClass: '',
    overwriteClass: false,
    autoFocus: false,
  }

  constructor(props) {
    super(props);
    this.state = { value: (props.value ? props.value : '') };
  }

  componentWillReceiveProps(newProps) {
    this.setState({ value: (newProps.value ? newProps.value : '') });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
    if (this.props.onChange) this.props.onChange(event);
  }

  render() {
    const {
      label,
      required,
      name,
      tabIndex,
      overwriteClass,
      inputClass,
      readOnly,
      autoFocus
    } = this.props;
    let { className } = this.props;
    if (!overwriteClass) className = `column ${className}`;

    return (
      <div className={className}>
        {label !== false &&
          <span className="input-group-title">
            {label} {required && <span className="isRequired">*</span>}
          </span>
        }
        <input
          className={`input is-primary ${inputClass}`}
          type="text"
          name={name}
          tabIndex={tabIndex}
          value={this.state.value}
          onChange={this.handleChange.bind(this)}
          required={required}
          readOnly={readOnly}
          autoFocus={autoFocus}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname
  };
}

export default connect(mapStateToProps, {})(InputGroup);
