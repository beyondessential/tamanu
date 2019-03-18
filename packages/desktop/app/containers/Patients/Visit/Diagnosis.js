import React, { Component } from 'react';
import moment from 'moment';
import { dateFormat } from '../../../constants';

class Diagnosis extends Component {
  render() {
    let { diagnoses, showSecondary } = this.props;
    if (typeof showSecondary === 'undefined') showSecondary = false;
    diagnoses = diagnoses.map(diagnosis => diagnosis.toJSON());
    diagnoses = diagnoses.filter(diagnosis => diagnosis.active && diagnosis.secondaryDiagnosis === showSecondary);
    return (
      <div>
        <div className={`column ${!diagnoses.length && showSecondary ? 'is-hidden' : ''}`}>
          <span className="title has-text-weight-semibold">{`${showSecondary ? 'Secondary' : 'Primary'} Diagnosis`}</span>
          <div className="clearfix" />
          {diagnoses.map((diagnosis, k) => (
            <React.Fragment key={diagnosis._id}>
              {k > 0 ? ', ' : ''}
              <span className="has-text-weight-light">
                {`${diagnosis.diagnosis} (${moment(diagnosis.date).format(dateFormat)})`}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
}

export default Diagnosis;
