import React, { Component } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import ReactTooltip from 'react-tooltip';
import styled from 'styled-components';
import { chain } from 'lodash';
import { Grid, Typography, Icon } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import PropTypes from 'prop-types';
import { MedicationHistoryModel, PatientModel } from '../../../models';
import {
  NewButton, TabHeader, UndoIconButton, TickIconButton, Button,
  SimpleTable,
} from '../../../components';
import {
  patientMedicationColumns, momentSimpleCalender,
  dateFormatText, MUI_SPACING_UNIT as spacing,
} from '../../../constants';

const PaddedIcon = styled(Icon)`
  padding: 8px 0;
  height: auto !important;
  width: auto !important;
  display: inline-block !important;
  font-size: 18px !important;
`;

const UndoIconButtonStyled = styled(UndoIconButton)`
  font-size: 18px !important;
  padding: 8px 0 !important;
`;

const TickIconButtonStyled = styled(TickIconButton)`
  font-size: 18px !important;
  padding: 8px 0 !important;
`;

export default class Medication extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
  }

  constructor(props) {
    super(props);
    this.goToPrev = this.goToPrev.bind(this);
    this.goToNext = this.goToNext.bind(this);
  }

  state = {
    medicationHistory: [],
    from: moment().subtract(1, 'days'),
    to: moment().add(1, 'days'),
    tableColumns: patientMedicationColumns,
  }

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  renderMedicineColumn = row => {
    const { original: medicine, value } = row;
    return (
      <React.Fragment>
        {value}
        {medicine.dispense && ' ** '}
      </React.Fragment>
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
      .find(({ date }) => moment(date).isSame(original.currentDate, 'day'))
      .get('medication')
      .find(({ _id }) => _id === original._id)
      .get('history')
      .find(({ date }) => moment(date).isSame(original.currentDate, 'day'))
      .get(fieldName)
      .value();
    return (
      <Grid container spacing={8}>
        <React.Fragment>
          <Grid container item xs justify="flex-end">
            {moment().isSame(original.currentDate)
              && isTaken
              && (
                <UndoIconButtonStyled
                  onClick={() => this.markTaken(
                    original._id,
                    original.currentDate,
                    fieldName,
                    false,
                  )}
                  data-tip="Undo"
                />
              )
            }
          </Grid>
          <Grid
            container
            item
            xs
            justify="center"
            alignItems="center"
          >
            <Typography variant="body2">
              {row.value}
            </Typography>
          </Grid>
        </React.Fragment>
        {(moment(original.currentDate).isBefore(moment().format())
          || isTaken) && !original.dispense
          && (
            <Grid item xs>
              <PaddedIcon
                className={`fa ${isTaken ? 'fa-check-circle' : 'fa-times-circle'}`}
                data-tip={isTaken ? 'Taken' : 'Not Taken'}
                style={{ color: isTaken ? 'green' : 'red' }}
              />
            </Grid>
          )
        }
        {moment(moment().format()).isSame(original.currentDate) && !isTaken && !original.dispense
          && (
            <Grid item xs>
              <TickIconButtonStyled
                data-tip="Mark as taken"
                onClick={() => this.markTaken(
                  original._id,
                  original.currentDate,
                  fieldName,
                  true,
                )}
              />
            </Grid>
          )
        }
      </Grid>
    );
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

  PaginationNav = (index = 0) => (
    <Grid container item xs justify="flex-end">
      <Button
        style={{ padding: 0, visibility: index === 0 ? 'visible' : 'hidden' }}
        onClick={this.goToPrev}
      >
        Prev
      </Button>
      <Button
        style={{ padding: 0, visibility: index === 0 ? 'visible' : 'hidden' }}
        onClick={this.goToNext}
      >
        Next
      </Button>
    </Grid>
  )

  handleChange(props = this.props) {
    const { patientModel } = props;
    const { from, to, tableColumns } = this.state;
    let medicationHistory = patientModel.getMedicationHistory(from.clone(), to.clone());
    medicationHistory = medicationHistory.map(obj => ({
      date: obj.date,
      medication: obj.medication.map(model => ({ currentDate: obj.date, ...model.toJSON({ relations: true }) })),
    }));

    // Add actions column for our table
    tableColumns[0].Cell = this.renderMedicineColumn;
    tableColumns[1].Cell = this.renderQtyColumn;
    tableColumns[2].Cell = this.renderQtyColumn;
    tableColumns[3].Cell = this.renderQtyColumn;
    tableColumns[4].Cell = this.renderQtyColumn;
    this.setState({ medicationHistory, tableColumns });
  }

  async markTaken(id, date, field, value) {
    const { patientModel } = this.props;
    const { from, to } = this.state;
    const medicationHistory = patientModel.getMedicationHistory(from.clone(), to.clone());
    const recordModel = chain(medicationHistory)
      .find(({ date: _date }) => moment(_date).isSame(date, 'day'))
      .get('medication')
      .find(({ id: _id }) => _id === id)
      .value();

    try {
      const { history } = recordModel.attributes;
      // Find model
      let historyModel = history.models.find(model => moment(date).isSame(model.get('date'), 'day'));
      if (!historyModel) historyModel = new MedicationHistoryModel();
      historyModel.set({ date, [field]: value });
      await historyModel.save(null, { silent: true });

      recordModel.get('history').add(historyModel);
      await recordModel.save(null, { silent: true });
      this.handleChange();
    } catch (err) {
      toast('Something went wrong while updating, please try again later.', { type: 'error' });
    }
  }

  render() {
    const { patientModel } = this.props;
    const { medicationHistory, tableColumns } = this.state;
    const hasMedication = medicationHistory.some(medicationObject => medicationObject.medication.length > 0);
    return (
      <Grid container>
        <TabHeader>
          <NewButton
            className="is-pulled-right"
            to={`/medication/request/by-patient/${patientModel.id}`}
            can={{ do: 'create', on: 'visit' }}
          >
            New Medication
          </NewButton>
        </TabHeader>
        <Grid container item>
          {
            medicationHistory.map(({ date, medication }, index) => (
              <Grid key={date} container item direction="row" style={{ marginTop: (index && spacing * 5) }}>
                <Grid
                  container
                  item
                  xs={12}
                  spacing={spacing}
                  style={{ backgroundColor: grey[100] }}
                >
                  <Grid item xs />
                  <Grid
                    container
                    item
                    xs
                    justify="center"
                    alignItems="center"
                  >
                    <Typography variant="button">
                      {this.getHeaderText(date)}
                    </Typography>
                  </Grid>
                  {this.PaginationNav(index)}
                </Grid>
                <Grid item xs={12}>
                  <SimpleTable
                    data={medication}
                    noDataText="No medication found"
                    columns={tableColumns}
                  />
                </Grid>
              </Grid>
            ))
          }
          <Typography variant="caption">
            ** dispensed medication
          </Typography>
        </Grid>
        <ReactTooltip />
      </Grid>
    );
  }
}
