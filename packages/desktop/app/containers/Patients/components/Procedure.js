import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class Procedure extends Component {
  static propTypes = {
    patientModel: PropTypes.object.isRequired,
  }

  state = {
    procedures: [],
  }

  componentWillMount() {
    const { patientModel } = this.props;
    const procedures = patientModel.getProcedures();
    this.setState({ procedures });
  }

  componentWillReceiveProps(newProps) {
    const { patientModel } = newProps;
    const procedures = patientModel.getProcedures();
    this.setState({ procedures });
  }

  render() {
    const { patientModel } = this.props;
    const { procedures } = this.state;
    return (
      <div>
        {procedures.length > 0
          && (
          <div className="column p-b-0">
            <span className="title">Procedures</span>
            <div className="is-clearfix" />
            {procedures.map((procedure, k) => (
              <React.Fragment key={`procedure-${k}`}>
                {k > 0 ? ', ' : ''}
                <Link className="add-button" to={`/patients/operationReport/${patientModel.id}/${procedure.operationReportId}`}>{`${procedure.name} (${procedure.date})`}</Link>
              </React.Fragment>
            ))}
          </div>
          )
        }
      </div>
    );
  }
}

export default Procedure;
