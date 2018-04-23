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

  render() {
    const { label, required, name } = this.props;
    return (
      <div className="column">
        <span>
          {label} {required && <span className="isRequired">*</span>}
        </span>
        <input className="input is-primary" type="text" name={name} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname
  };
}

export default connect(mapStateToProps, undefined)(InputGroup);
