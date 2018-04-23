import React, { Component } from 'react';
import { connect } from 'react-redux';

class InputGroup extends Component {
  render() {
    return (
      <div>
        <div className="input">
          Input
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

export default connect(mapStateToProps, undefined)(InputGroup);
