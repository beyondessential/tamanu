import React, { Component } from 'react';

class Dignosis extends Component {
  constructor(props) {
    super(props);
    this.addPlan = this.addPlan.bind(this);
  }

  addPlan() {
    const { patient } = this.props;
    this.props.history.push(`/patients/operativePlan/${patient._id}`);
  }

  render() {
    return (
      <div className="column">
        <span className="title">Operative Plan  </span>
        <a className="add-button" onClick={this.addPlan}>
          + Add Operative Plan
        </a>
      </div>
    );
  }
}

export default Dignosis;
