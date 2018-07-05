import React, { Component } from 'react';

class Programs extends Component {
  showAntenatal() {
    this.props.history.push('/programs/pregnancyConfirm');
  }
  showGestantional() {
    this.props.history.push('/programs/pregnancyConfirm');
  }
  showOnset() {
    this.props.history.push('/programs/pregnancyConfirm');
  }
  showPregnancy() {
    this.props.history.push('/programs/pregnancyConfirm');
  }
  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Programs
          </span>
        </div>
      </div>
    );
  }
}

export default Programs;
