import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Autocomplete from 'react-autocomplete';
import { map, toUpper, capitalize } from 'lodash';
import { PatientsCollection } from '../collections';
import { PatientModel } from '../models';

class PatientAutocomplete extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    required: false,
    className: '',
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    patients: []
  }

  async componentWillMount() {
    const { value: _id } = this.props;
    if (_id) {
      const model = new PatientModel();
      model.set({ _id });
      await model.fetch();
      this.setState({ patientRef: `${model.get('displayId')} - ${model.get('firstName')} ${model.get('lastName')}` });
    }
  }

  async handleChange(event, value) {
    try {
      this.props.collection.setPageSize(1000);
      this.props.collection.setKeyword(value);
      await this.props.collection.getPage(0).promise();
      let { models: patients } = this.props.collection;
      if (patients.length > 0) patients = map(patients, patient => patient.attributes);
      this.setState({ patients, patientRef: value });
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    const {
      label,
      required,
      name,
      className,
    } = this.props;

    return (
      <div className={`column ${className}`}>
        <span className="input-group-title">
          {label} {required && <span className="isRequired">*</span>}
        </span>
        <Autocomplete
          inputProps={{ name: 'patient' }}
          getItemValue={(item) => `${item.displayId} - ${item.firstName} ${item.lastName}`}
          wrapperProps={{ className: 'autocomplete-wrapper' }}
          items={this.state.patients}
          value={this.state.patientRef}
          onSelect={(val, item) => {
            this.setState({ patientRef: val });
            if (this.props.onChange) this.props.onChange(item._id, name);
          }}
          onChange={this.handleChange}
          renderItem={(item, isHighlighted) =>
            <div key={item._id} style={{ background: isHighlighted ? 'lightgray' : 'white' }}> {`${item.displayId} - ${item.firstName} ${item.lastName}`} </div>
          }
          renderMenu={(items, val, style) => <div className="autocomplete-dropmenu" style={{ ...style, ...this.menuStyle }}>{items}</div>}
        />
      </div>
    );
  }
}

const mapDispatchToProps = () => ({
  collection: new PatientsCollection(),
});

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PatientAutocomplete);
