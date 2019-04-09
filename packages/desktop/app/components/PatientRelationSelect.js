import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { PatientModel } from '../models';
import { SelectInput } from './Field';
import { setRedirectLocation } from '../actions/misc';
import { history } from '../store';

const ADD_NEW_VISIT = 'addNewVisit';

class PatientRelationSelect extends Component {
  static propTypes = {
    patient: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(PatientModel)]),
    relation: PropTypes.string.isRequired,
    template: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    dispatchSetRedirectTo: PropTypes.func.isRequired,
    required: PropTypes.bool,
    value: PropTypes.string,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
  }

  static defaultProps = {
    patient: null,
    required: false,
    onChange: () => {},
    value: '',
  }

  constructor(props) {
    super(props);
    this.patientModel = new PatientModel();
  }

  state = {
    options: [],
  }

  componentDidMount() {
    this.loadRelations();
  }

  componentWillReceiveProps(newProps) {
    const { name, onChange } = this.props;
    if (newProps.patient !== this.props.patient) {
      onChange({ target: { name, value: null } }); // reset
      this.loadRelations(newProps);
    }
  }

  handleOnChange = event => {
    const { onChange, dispatchSetRedirectTo } = this.props;
    const { value } = event.target;
    // save current location and redirect
    if (ADD_NEW_VISIT === value) {
      dispatchSetRedirectTo();
      return history.push(`/patients/visit/${this.patientModel.id}`);
    }
    onChange(event);
  }

  async loadRelations(props = this.props) {
    const {
      patient, relation, template, onChange, name,
    } = props;
    const updates = { initValue: null };
    if (patient) {
      let patientModel = patient;
      if (typeof patient === 'string') {
        this.patientModel.set({ _id: patient });
        await this.patientModel.fetch();
        patientModel = this.patientModel;
      }

      // get select options
      const { [relation]: relationCollection } = patientModel.attributes;
      const optionsTransformed = relationCollection.map(model => ({ value: model.get('_id'), label: template(model.toJSON()) }));

      // find patients current visit and set that as initial value
      if (relation === 'visits') {
        const currentVisit = relationCollection.find(visitModel => visitModel.isCurrentVisit());
        if (currentVisit) {
          updates.initValue = currentVisit.get('_id');
          onChange({ target: { name, value: updates.initValue } });
        }
        // add new visit option
        optionsTransformed.push({ value: ADD_NEW_VISIT, label: 'Add new Visit' });
      }

      this.setState({ ...updates, options: optionsTransformed });
    }
  }

  render() {
    const {
      label,
      template,
      name,
      value,
      dispatchSetRedirectTo: _, // strip prop
      ...props
    } = this.props;
    const { options, initValue } = this.state;
    return (
      <SelectInput
        label={label}
        options={options}
        name={name}
        value={value || initValue}
        {...props}
        onChange={this.handleOnChange}
      />
    );
  }
}

function mapStateToProps(state) {
  const { location } = state.misc;
  return { location };
}

const mapDispatchToProps = dispatch => ({
  dispatchSetRedirectTo: () => dispatch(setRedirectLocation(history.location.pathname)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PatientRelationSelect);
