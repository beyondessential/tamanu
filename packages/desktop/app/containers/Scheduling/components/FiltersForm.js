import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Collapse } from '@material-ui/core';
import {
  TextInput, SelectInput, ClearButton,
  FilterButton, Container,
} from '../../../components';
import {
  visitOptions as visitOptionsOriginal, MUI_SPACING_UNIT as spacing,
  appointmentStatusList as appointmentStatusListOriginal,
} from '../../../constants';

const visitOptions = [{ value: 'all', label: 'All' }, ...visitOptionsOriginal];
const appointmentStatusList = [{ value: 'all', label: 'All' }, ...appointmentStatusListOriginal];

export default class FiltersForm extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    collapse: PropTypes.bool,
    location: PropTypes.string,
    status: PropTypes.string,
    type: PropTypes.string,
    practitioner: PropTypes.string,
  }

  static defaultProps = {
    loading: false,
    collapse: true,
    status: '',
    type: '',
    practitioner: '',
    location: '',
  }

  constructor(props) {
    super(props);
    const {
      status, type, practitioner, location,
    } = props;
    this.state = {
      status,
      type,
      practitioner,
      location,
    };
  }

  onSubmit = (e) => {
    e.preventDefault();
    const { location, practitioner } = this.state;
    let { status, type } = this.state;
    if (status === 'all') status = '';
    if (type === 'all') type = '';
    this.props.onSubmit({
      location, status, type, practitioner,
    });
  }

  handleInputChange = (event, field) => {
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

  resetForm = () => {
    const {
      location, status, type, practitioner,
    } = this.props;
    this.setState({
      location, status, type, practitioner,
    }, () => this.props.onSubmit({
      location, status, type, practitioner,
    }));
  }

  render() {
    const {
      status,
      type,
      practitioner,
      location,
    } = this.state;

    const {
      loading,
      collapse,
      surgery,
    } = this.props;

    return (
      <Collapse in={collapse}>
        <Container autoHeight>
          <form onSubmit={this.onSubmit}>
            <Grid container spacing={spacing * 2}>
              <Grid item xs>
                <SelectInput
                  label="Status"
                  name="status"
                  options={appointmentStatusList}
                  onChange={this.handleInputChange}
                  value={status}
                />
              </Grid>
              {!surgery
                && (
                  <Grid item xs>
                    <SelectInput
                      label="Type"
                      name="type"
                      options={visitOptions}
                      onChange={this.handleInputChange}
                      value={type}
                    />
                  </Grid>
                )
              }
              <Grid item xs>
                <TextInput
                  name="practitioner"
                  label="With"
                  onChange={this.handleInputChange}
                  value={practitioner}
                  placeholder="Practitioner"
                />
              </Grid>
              <Grid item xs>
                <TextInput
                  name="location"
                  label="Location"
                  onChange={this.handleInputChange}
                  value={location}
                />
              </Grid>
              <Grid container item xs={12} justify="flex-end">
                <ClearButton onClick={this.resetForm} />
                <FilterButton type="submit" disabled={loading} />
              </Grid>
            </Grid>
          </form>
        </Container>
      </Collapse>
    );
  }
}
