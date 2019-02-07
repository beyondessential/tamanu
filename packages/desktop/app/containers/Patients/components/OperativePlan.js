import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { TextButton } from '../../../components';

class Dignosis extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
  }

  render() {
    const { model: Model } = this.props;
    const operationPlan = Model.getOpenPlan();
    return (
      <div className="column">
        <span className="title">Operative Plan </span>
        {isEmpty(operationPlan) && <TextButton
            can={{ do: 'create', on: 'operativePlan' }}
            to={`/patients/operativePlan/${Model.id}`}
          > + Add Operative Plan</TextButton>}
        {!isEmpty(operationPlan) &&
          <React.Fragment>
            <br />
            <TextButton
              can={{ do: 'read', on: 'operativePlan' }}
              to={`/patients/operativePlan/${Model.id}/${operationPlan._id}`}
            > Current Operative Plan</TextButton>
          </React.Fragment>
        }
      </div>
    );
  }
}

export default Dignosis;
