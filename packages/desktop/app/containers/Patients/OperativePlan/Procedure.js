import React, { Component } from 'react';
import { clone, pull } from 'lodash';
import InputGroup from '../../../components/InputGroup';

class Prodcedure extends Component {
  constructor(props) {
    super(props);
    this.addProcedure = this.addProcedure.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  state = {
    procedure: '',
    procedures: [],
  }

  componentWillReceiveProps(newProps) {
    const { procedures } = newProps;
    this.setState({ procedures });
  }

  addProcedure() {
    const procedures = clone(this.state.procedures);
    procedures.push(this.state.procedure);
    this.setState({ procedures, procedure: '' }, () => {
      this.props.onChange(procedures, 'procedures');
    });
  }

  removeProcedure(value) {
    let procedures = clone(this.state.procedures);
    procedures = pull(procedures, value);
    this.setState({ procedures, procedure: '' }, () => {
      this.props.onChange(procedures, 'procedures');
    });
  }

  handleInput(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  render() {
    // const { patient, model } = this.props;
    const { procedures } = this.state;
    return (
      <div>
        <div className="columns">
          <div className="column is-10 p-r-5">
            <InputGroup
              name="procedure"
              label="Procedure"
              value={this.state.procedure}
              required
              tabIndex={2}
              onChange={this.handleInput}
            />
          </div>
          <div className="column is-2 p-l-5">
            <button className="button is-primary m-t-40" onClick={this.addProcedure} type="button">
              <i className="fa fa-plus p-r-5 inline-block" />
              {' '}
Add Procedure
            </button>
          </div>
        </div>

        <div className={`columns ${!procedures.length ? 'is-hidden' : ''}`}>
          <div className="column">
            <div className="column">
              <span className="input-group-title">
                Procedures
              </span>
              <table className="table">
                <thead>
                  <tr>
                    <th className="has-background-grey-lighter has-text-weight-normal">Procedure</th>
                    <th className="has-background-grey-lighter has-text-weight-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {procedures.map((procedure, key) => (
                    <tr key={`procedure-${key}`}>
                      <td>{procedure}</td>
                      <td>
                        <button className="button is-danger is-small" type="button" onClick={() => { this.removeProcedure(procedure); }}>
                          <i className="fa fa-times inline-block m-r-5" />
                          {' '}
Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Prodcedure;
