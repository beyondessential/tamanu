import React, { Component } from 'react';
import { Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import AllergyModal from './AllergyModal';
import { TextButton } from '../../../components';
import { PatientModel } from '../../../models';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';

export default class Allergy extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
  }

  state = {
    modalVisible: false,
    action: 'new',
    itemId: null,
    allergies: [],
  }

  componentWillMount() {
    const { patientModel } = this.props;
    const { allergies } = patientModel.attributes;
    this.setState({ allergies });
  }

  componentWillReceiveProps(newProps) {
    const { patientModel } = newProps;
    const { allergies } = patientModel.attributes;
    this.setState({ allergies });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editAllergy = (itemId) => () => {
    this.setState({ modalVisible: true, action: 'edit', itemId });
  }

  newAllergy = () => {
    this.setState({ modalVisible: true, action: 'new', itemId: null });
  }

  render() {
    const { patientModel } = this.props;
    const {
      modalVisible, action, itemId, allergies,
    } = this.state;
    return (
      <React.Fragment>
        <Grid container item>
          <Grid item style={{ paddingRight: spacing }}>
            <Typography variant="body2">
              Patient Allergies
            </Typography>
          </Grid>
          <Grid item>
            <TextButton
              can={{ do: 'create', on: 'allergy' }}
              onClick={this.newAllergy}
            >
              + Add Allergy
            </TextButton>
          </Grid>
        </Grid>
        <Grid container item xs={12} style={{ paddingTop: 0 }}>
          {allergies.toJSON().map(({ _id, name }, k) => (
            <React.Fragment key={_id}>
              {k > 0 ? ', ' : ''}
              <TextButton
                can={{ do: 'create', on: 'allergy' }}
                onClick={this.editAllergy(_id)}
              >
                {name}
              </TextButton>
            </React.Fragment>
          ))}
        </Grid>
        <AllergyModal
          itemId={itemId}
          patientModel={patientModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
        />
      </React.Fragment>
    );
  }
}
