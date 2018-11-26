import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import {
  InputGroup,
  SelectGroup,
  ClearButton,
  FilterButton
} from '../../../components';
import {
  visitOptions as  visitOptionsOriginal,
  appointmentStatusList as appointmentStatusListOriginal,
} from '../../../constants';

const visitOptions = [ ...visitOptionsOriginal, { value: 'all', label: 'All' } ];
const appointmentStatusList = [ ...appointmentStatusListOriginal, { value: 'all', label: 'All' } ];

class FiltersForm extends Component {
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
    const { status, type, practitioner, location } = props;
    this.state = {
      status,
      type,
      practitioner,
      location,
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.resetForm = this.resetForm.bind(this);
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
    const { location, practitioner } = this.state;
    let { status, type } = this.state;
    if (status === 'all') status = '';
    if (type === 'all') type = '';
    e.preventDefault();
    this.props.onSubmit({ location, status, type, practitioner });
  }

  resetForm() {
    const { location, status, type, practitioner } = this.props;
    this.setState({ location, status, type, practitioner }, () =>
      this.props.onSubmit({ location, status, type, practitioner })
    );
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
      theatre
    } = this.props;

    return (
      <Collapse in={collapse}>
        <form onSubmit={this.onSubmit}>
          <div className="columns p-t-10">
            <SelectGroup
              className="column is-3"
              label="Status"
              name="status"
              options={appointmentStatusList}
              onChange={this.handleInputChange}
              value={status}
            />
            {!theatre &&
              <SelectGroup
                className="column is-3"
                label="Type"
                name="type"
                options={visitOptions}
                onChange={this.handleInputChange}
                value={type}
              />
            }
            <InputGroup
              name="practitioner"
              label="With"
              onChange={this.handleInputChange}
              value={practitioner}
              placeholder="Practitioner"
            />
            <InputGroup
              name="location"
              label="Location"
              onChange={this.handleInputChange}
              value={location}
            />
          </div>
          <div className="columns">
            <div className="column">
              <div className="column has-text-right">
                <ClearButton onClick={this.resetForm} />
                <FilterButton disabled={loading} />
              </div>
            </div>
          </div>
        </form>
      </Collapse>
    );
  }
}

export default FiltersForm;
