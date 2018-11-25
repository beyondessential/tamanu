import React, { Component } from 'react';

class Allergy extends Component {
  render() {
    const { patient } = this.props;
    return (
      <div>
        <div className="column" >
          <span className="title has-text-weight-semibold">Patient Allergies  </span>
          <div className="clearfix" />
          {patient.allergies.map((allergy, k) => {
            return (
              <React.Fragment key={allergy._id}>
                {k > 0 ? ', ' : ''}
                <span className="has-text-weight-light">{allergy.name}</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Allergy;
