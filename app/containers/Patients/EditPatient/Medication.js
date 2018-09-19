import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Link } from 'react-router-dom';
import {
  patientMedicationColumns,
  momentSimpleCalender,
  dateFormatText
} from '../../../constants';

class Medication extends Component {
  constructor(props) {
    super(props);
    this.goToPrev = this.goToPrev.bind(this);
    this.goToNext = this.goToNext.bind(this);
  }

  state = {
    medicationHistory: [],
    from: moment().subtract(1, 'days'),
    to: moment().add(1, 'days'),
  }

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { model: Model } = props;
    const { from, to } = this.state;
    let medicationHistory = Model.getMedicationHistory(from.clone(), to.clone());
    medicationHistory = medicationHistory.map(obj => ({
      date: obj.date,
      medication: obj.medication.map(model => model.toJSON({ relations: true }))
    }));
    this.setState({ medicationHistory });
  }

  goToPrev = () => {
    const { from, to } = this.state;
    from.subtract(1, 'days');
    to.subtract(1, 'days');
    this.setState({ from, to }, this.handleChange);
  }

  goToNext = () => {
    const { from, to } = this.state;
    from.add(1, 'days');
    to.add(1, 'days');
    this.setState({ from, to }, this.handleChange);
  }

  render() {
    const { model: Model } = this.props;
    const { medicationHistory } = this.state;
    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <Link className="button is-primary is-pulled-right is-block" to={`/medication/request/by-patient/${Model.id}`}>
            <i className="fa fa-plus" /> Add Medication
          </Link>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {medicationHistory.length > 0 &&
            medicationHistory.map(({ date, medication }, k) => {
              return (
                <div key={date}>
                  <div className="column medication-header">
                    {k === 0 &&
                      <button className="button is-pulled-left is-small" onClick={this.goToPrev}>
                        <span className="icon is-small">
                          <i className="fa fa-chevron-left" />
                        </span>
                      </button>
                    }
                    <span className="text">{`${moment(date).calendar(null, momentSimpleCalender)} - ${moment(date).format(dateFormatText)}`}</span>
                    {k === 0 &&
                      <button className="button is-pulled-right is-small" onClick={this.goToNext}>
                        <span className="icon is-small">
                          <i className="fa fa-chevron-right" />
                        </span>
                      </button>
                    }
                  </div>
                  <ReactTable
                    keyField="_id"
                    data={medication}
                    pageSize={medication.length}
                    columns={patientMedicationColumns}
                    className="-striped m-b-20"
                    defaultSortDirection="asc"
                    showPagination={false}
                  />
                </div>
              );
            })
          }
          {medicationHistory.length === 0 &&
            <div>
              <div className="column medication-header">
                <button className="button is-pulled-left is-small" onClick={this.goToPrev}>
                  <span className="icon is-small">
                    <i className="fa fa-chevron-left" />
                  </span>
                </button>
                <button className="button is-pulled-right is-small" onClick={this.goToNext}>
                  <span className="icon is-small">
                    <i className="fa fa-chevron-right" />
                  </span>
                </button>
              </div>
              <div className="notification">
                <span>
                  No medication found.
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default Medication;
