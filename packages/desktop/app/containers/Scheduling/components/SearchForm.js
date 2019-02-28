import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { clone } from 'lodash';
import Button from '@material-ui/core/Button';
import {
  InputGroup,
  DatepickerGroup,
  SelectGroup
} from '../../../components';
import {
  visitOptions as  visitOptionsOriginal,
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
    const { startDate, status, type, practitioner } = props;
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

  onSubmit(e) {
    const { startDate, practitioner } = this.state;
    let { status, type } = this.state;
    if (status === 'all') status = '';
    if (type === 'all') type = '';
    e.preventDefault();
    this.props.onSubmit({ startDate, status, type, practitioner });
  }

  resetForm() {
    const { startDate, status, type, practitioner } = this.props;
    this.setState({ startDate, status, type, practitioner }, () =>
      this.props.onSubmit({ startDate, status, type, practitioner })
    );
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
        <div className="columns">
          <DatepickerGroup
            className="column is-3"
            name="startDate"
            label="Start Date"
            onChange={this.handleInputChange}
            value={startDate}
          />
          <SelectGroup
            className="column is-3"
            label="Status"
            name="status"
            options={appointmentStatusList}
            onChange={this.handleInputChange}
            value={status}
          />
          <SelectGroup
            className="column is-3"
            label="Type"
            name="type"
            options={visitOptions}
            onChange={this.handleInputChange}
            value={type}
          />
          <InputGroup
            name="practitioner"
            label="With"
            onChange={this.handleInputChange}
            value={practitioner}
            placeholder="Practitioner"
          />
        </div>
        <div className="columns">
          <div className="column">
            <div className="column has-text-right">
              <Button color="default" variant="contained" onClick={this.resetForm} classes={{ root: 'm-r-5' }}>Reset</Button>
              <Button color="primary" variant="contained" type="submit" disabled={loading}>Search</Button>
            </div>
          </div>
        </div>
      </form>
    );
  }
}
