import React, { Component } from 'react';
import { isEmpty } from 'lodash';

class Dignosis extends Component {
  constructor(props) {
    super(props);
    this.addPlan = this.addPlan.bind(this);
  }

  addPlan() {
    const { patient } = this.props;
    this.props.history.push(`/patients/operativePlan/${patient._id}`);
  }

  goEdit(id) {
    const { patient } = this.props;
    this.props.history.push(`/patients/operativePlan/${patient._id}/${id}`);
  }

  render() {
    const { model } = this.props;
    const operationPlan = model.getOpenPlan();

    let link = <a className="add-button" onClick={this.addPlan}>+ Add Operative Plan</a>;
    if (!isEmpty(operationPlan)) {
      link = (
        <React.Fragment>
          <br />
          <a className="add-button" onClick={() => { this.goEdit(operationPlan._id); }}>Current Operative Plan</a>
        </React.Fragment>
      );
    }

    return (
      <div className="column">
        <span className="title">Operative Plan</span>
        {link}
      </div>
    );
  }
}

export default Dignosis;
