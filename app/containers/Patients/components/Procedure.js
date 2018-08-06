import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class Procedure extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
  }

  state = {
    procedures: []
  }

  componentWillMount() {
    const { model: Model } = this.props;
    const procedures = Model.getProcedures();
    this.setState({ procedures });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const procedures = Model.getProcedures();
    this.setState({ procedures });
  }

  render() {
    const { model: Model } = this.props;
    const { procedures } = this.state;
    return (
      <div>
        {procedures.length > 0 &&
          <div className="column p-b-0">
            <span className="title">Procedures</span>
            <div className="is-clearfix" />
            {procedures.map((procedure, k) => {
              return (
                <React.Fragment key={`procedure-${k}`}>
                  {k > 0 ? ', ' : ''}
                  <Link className="add-button" to={`/patients/operationReport/${Model.id}/${procedure.operationReportId}`}>{`${procedure.name} (${procedure.date})`}</Link>
                </React.Fragment>
              );
            })}
          </div>
        }
      </div>
    );
  }
}

export default Procedure;
