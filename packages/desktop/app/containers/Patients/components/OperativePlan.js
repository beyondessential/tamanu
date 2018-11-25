import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

class Dignosis extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
  }

  render() {
    const { model: Model } = this.props;
    const operationPlan = Model.getOpenPlan();
    return (
      <div className="column">
        <span className="title">Operative Plan</span>
        {isEmpty(operationPlan) && <Link className="add-button" to={`/patients/operativePlan/${Model.id}`}>+ Add Operative Plan</Link>}
        {!isEmpty(operationPlan) &&
          <React.Fragment>
            <br />
            <Link className="add-button" to={`/patients/operativePlan/${Model.id}/${operationPlan._id}`}>Current Operative Plan</Link>
          </React.Fragment>
        }
      </div>
    );
  }
}

export default Dignosis;
