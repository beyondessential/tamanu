import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class TextareaGroup extends Component {
  static propTypes = {
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    required: false
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
    } = this.props;
    return (
      <div className="field">
        {label &&
          <label className="input-group-title label">
            {label} {required && <span className="isRequired">*</span>}
          </label>
        }
        <div className="control">
          <textarea
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

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname
  };
}

export default connect(mapStateToProps, {})(TextareaGroup);
