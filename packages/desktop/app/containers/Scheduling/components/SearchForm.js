import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { clone } from 'lodash';
import { Grid } from '@material-ui/core';
import {
  TextInput, DateInput, SelectInput, Button, Container,
} from '../../../components';
import {
  visitOptions as visitOptionsOriginal, MUI_SPACING_UNIT as spacing,
  appointmentStatusList as appointmentStatusListOriginal,
} from '../../../constants';

export default class SearchForm extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    startDate: PropTypes.object,
    status: PropTypes.string,
    type: PropTypes.string,
    practitioner: PropTypes.string,
  }

  static defaultProps = {
    loading: false,
    startDate: moment(),
    status: '',
    type: '',
    practitioner: '',
  }

  constructor(props) {
    super(props);
    const {
      startDate, status, type, practitioner,
    } = props;
    this.state = {
      startDate,
      status,
      type,
      practitioner,
      visitOptions: [],
      appointmentStatusList: [],
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.resetForm = this.resetForm.bind(this);
  }

  componentWillMount() {
    const visitOptions = clone(visitOptionsOriginal);
    const appointmentStatusList = clone(appointmentStatusListOriginal);
    visitOptions.unshift({ value: 'all', label: 'All' });
    appointmentStatusList.unshift({ value: 'all', label: 'All' });
    this.setState({ visitOptions, appointmentStatusList });
  }

  onSubmit(e) {
    const { startDate, practitioner } = this.state;
    let { status, type } = this.state;
    if (status === 'all') status = '';
    if (type === 'all') type = '';
    e.preventDefault();
    this.props.onSubmit({
      startDate, status, type, practitioner,
    });
  }

  handleInputChange(event, field) {
    let name = '';
    let value = '';
    if (typeof field !== 'undefined') {
      name = field;
      value = event;
    } else {
      ({ name } = event.target);
      value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    }

    this.setState({ [name]: value });
  }

  resetForm() {
    const {
      startDate, status, type, practitioner,
    } = this.props;
    this.setState({
      startDate, status, type, practitioner,
    }, () => this.props.onSubmit({
      startDate, status, type, practitioner,
    }));
  }

  render() {
    const {
      startDate,
      status,
      type,
      practitioner,
      visitOptions,
      appointmentStatusList,
    } = this.state;
    const { loading } = this.props;

    return (
      <form onSubmit={this.onSubmit}>
        <Container autoHeight>
          <Grid container spacing={spacing * 2}>
            <Grid item xs>
              <DateInput
                className="column is-3"
                name="startDate"
                label="Start Date"
                onChange={this.handleInputChange}
                value={startDate}
              />
            </Grid>
            <Grid item xs>
              <SelectInput
                className="column is-3"
                label="Status"
                name="status"
                options={appointmentStatusList}
                onChange={this.handleInputChange}
                value={status}
              />
            </Grid>
            <Grid item xs>
              <SelectInput
                className="column is-3"
                label="Type"
                name="type"
                options={visitOptions}
                onChange={this.handleInputChange}
                value={type}
              />
            </Grid>
            <Grid item xs>
              <TextInput
                name="practitioner"
                label="With"
                onChange={this.handleInputChange}
                value={practitioner}
                placeholder="Practitioner"
              />
            </Grid>
            <Grid container item xs={12} justify="flex-end">
              <Button color="default" variant="contained" onClick={this.resetForm} classes={{ root: 'm-r-5' }}>Reset</Button>
              <Button color="primary" variant="contained" type="submit" disabled={loading}>Search</Button>
            </Grid>
          </Grid>
        </Container>
      </form>
    );
  }
}
