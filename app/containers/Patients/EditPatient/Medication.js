import React, { Component, Fragment } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactTooltip from 'react-tooltip';
import { chain } from 'lodash';
import { MedicationHistoryModel } from '../../../models';
import {
  patientMedicationColumns,
  momentSimpleCalender,
  dateFormatText,
  dateFormat
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
    tableColumns: patientMedicationColumns
  }

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { model: Model } = props;
    const { from, to, tableColumns } = this.state;
    let medicationHistory = Model.getMedicationHistory(from.clone(), to.clone());
    medicationHistory = medicationHistory.map(obj => ({
      date: obj.date,
      medication: obj.medication.map(model => ({ currentDate: obj.date, ...model.toJSON({ relations: true }) }))
    }));

    // Add actions column for our table
    // tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    tableColumns[1].Cell = this.renderQtyColumn;
    tableColumns[2].Cell = this.renderQtyColumn;
    tableColumns[3].Cell = this.renderQtyColumn;
    tableColumns[4].Cell = this.renderQtyColumn;
    this.setState({ medicationHistory, tableColumns });
  }

  setActionsCol = (row) => {
    const { model: Model } = this.props;
    const id = `__${row.original._id}`;
    return (
      <div className="dropdown is-hoverable">
        <div className="dropdown-trigger" aria-haspopup="true" aria-controls={id}>
          <button className="button">
            <span>Taken</span>
            <span className="icon is-small">
              <i className="fa fa-angle-down" />
            </span>
          </button>
        </div>
        <div className="dropdown-menu" id={id} role="menu">
          <div className="dropdown-content">
            <a href="#" className="dropdown-item">
              Overview
            </a>
            <a href="#" className="dropdown-item">
              Modifiers
            </a>
          </div>
        </div>
      </div>
    );
  }

  renderQtyColumn = row => {
    const { original, column } = row;
    const { medicationHistory } = this.state;
    const fieldName = chain(column.id)
                        .toLower()
                        .replace('qty', '')
                        .value();
    const isTaken = chain(medicationHistory)
                      .find(({ date }) => date === original.currentDate)
                      .get('medication')
                      .find(({ _id }) => _id === original._id)
                      .get('history')
                      .find(({ date }) => date === original.currentDate)
                      .get(fieldName)
                      .value();
    return (
      <div className="medication-chart-cell">
        <span className="is-inline-block">{row.value}</span>
        {(moment(original.currentDate).isBefore(moment().format(dateFormat)) || isTaken) &&
          <Fragment>
            <span 
              className={`is-rounded icon is-pulled-right p-l-35 is-pulled-left has-text-${isTaken ? 'success' : 'danger'}`}
              data-tip={isTaken ? 'Taken' : 'Not Taken'}
            >
              <i className={`fa ${isTaken ? 'fa-check' : 'fa-times'}`} />
            </span>
            {moment(moment().format(dateFormat)).isSame(original.currentDate) && isTaken &&
              <button
                className="button is-default is-small"
                onClick={() => this.markTaken(original._id, original.currentDate, fieldName, false)}
                data-tip="Undo"
              >
                <i className="fa fa-undo" />
              </button>
            }
          </Fragment>
        }
        {moment(moment().format(dateFormat)).isSame(original.currentDate) && !isTaken &&
          <button
            className="button is-default is-small is-pulled-right has-text-success"
            onClick={() => this.markTaken(original._id, original.currentDate, fieldName, true)}
            data-tip="Mark as taken"
          >
            <i className="fa fa-check" />
          </button>
        }
      </div>
    );
  }

  async markTaken(id, date, field, value) {
    const { model: Model } = this.props;
    const { from, to } = this.state;
    const medicationHistory = Model.getMedicationHistory(from.clone(), to.clone());
    const recordModel = chain(medicationHistory)
                          .find(({ date: _date }) => _date === date)
                          .get('medication')
                          .find(({ id: _id }) => _id === id)
                          .value();

    try {
      const { history } = recordModel.attributes;
      let historyModel = history.findWhere({ date });
      if (!historyModel) historyModel = new MedicationHistoryModel();
      historyModel.set({ date, [field]: value });
      await historyModel.save(null, { silent: true });

      recordModel.get('history').add(historyModel.attributes);
      await recordModel.save(null, { silent: true });
      this.handleChange();
    } catch (err) {
      toast('Something went wrong while updating, please try again later.', { type: 'error' });
    }
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

  getHeaderText = (date) => {
    const days = ['Yesterday', 'Today', 'Tomorrow'];
    const calenderText = moment(date).calendar(null, momentSimpleCalender);
    if (days.includes(calenderText)) return `${calenderText} - ${moment(date).format(dateFormatText)}`;
    return `${moment(date).format(dateFormatText)}`;
  }

  render() {
    const { model: Model } = this.props;
    const { medicationHistory, tableColumns } = this.state;
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
                    <span className="text">{this.getHeaderText(date)}</span>
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
                    noDataText="No nedication found"
                    pageSize={medication.length}
                    columns={tableColumns}
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
        <ReactTooltip />
      </div>
    );
  }
}

export default Medication;
