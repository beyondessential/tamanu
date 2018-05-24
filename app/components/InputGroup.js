import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class InputGroup extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
  }

  static defaultProps = {
    required: false
  }

  constructor(props) {
    super(props);
    this.state = { value: props.value };
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  render() {
    const {
      label,
      required,
      name,
      tabIndex
    } = this.props;
    return (
      <div className="column">
        <span className="input-group-title">
          {label} {required && <span className="isRequired">*</span>}
        </span>
        <input className="input is-primary" type="text" name={name} tabIndex={tabIndex} value={this.state.value} onChange={this.handleChange.bind(this)} />
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
