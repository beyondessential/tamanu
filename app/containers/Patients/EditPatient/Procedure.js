import React, { Component } from 'react';

class Procedure extends Component {
  navigateTo(e, operationReportId) {
    e.preventDefault();
    const { patient } = this.props;
    this.props.history.push(`/patients/operationReport/${patient._id}/${operationReportId}`);
  }

  render() {
    const { procedures } = this.props;

    return (
      <div>
        <div className="column p-b-0">
          <span className="title">Procedures</span>
          <div className="clearfix" />
          {procedures.map((procedure, k) => {
            return (
              <React.Fragment key={`procedure-${k}`}>
                {k > 0 ? ', ' : ''}
                <a className="add-button" onClick={(e) => this.navigateTo(e, procedure.operationReportId)}>{`${procedure.name} (${procedure.date})`}</a>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Procedure;
