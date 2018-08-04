import React, { Component } from 'react';
import PropTypes from 'prop-types';

class TopRow extends Component {
  static propTypes = {
    patient: PropTypes.object.isRequired,
  }

  render() {
    const { patient } = this.props;
    return (
      <div>
        <div className="columns is-multiline is-variable m-b-0">
          <div className="column p-b-0 is-8">
            <div className="column p-b-5 p-t-0">
              <span className="title">Name: </span>
              <span className="full-name">
                {patient.firstName} {patient.lastName}
              </span>
            </div>
            <div className="column p-b-5 p-t-5">
              <span className="title is-medium">Sex: </span>
              <span className="is-medium">
                {patient.sex}
              </span>
            </div>
            <div className="column p-t-5 p-b-5">
              <span className="title is-medium">Age: </span>
              <span className="is-medium">
                {patient.age}
              </span>
            </div>
          </div>
          <div className="column p-b-0 is-4">
            <div className="align-left">
              <div className="card-info">
                {patient.displayId}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TopRow;
