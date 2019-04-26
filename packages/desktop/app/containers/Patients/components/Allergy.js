import React, { Component } from 'react';
import { Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import AllergyModal from './AllergyModal';
import { TextButton } from '../../../components';
import { PatientModel, AllergyModel } from '../../../models';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';

export default class Allergy extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
  }

  state = {
    modalVisible: false,
    itemId: null,
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editAllergy = (itemId) => () => {
    this.setState({ modalVisible: true, itemId });
  }

  newAllergy = () => {
    this.setState({ modalVisible: true, itemId: null });
  }

  render() {
    const { patientModel } = this.props;
    const { modalVisible, itemId } = this.state;
    const { allergies } = patientModel.toJSON();

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
          {allergies.map(({ _id, name }, k) => (
            <Grid item key={_id}>
              {k > 0 ? ', ' : ''}
              <TextButton
                can={{ do: 'create', on: 'allergy' }}
                onClick={this.editAllergy(_id)}
              >
                {name}
              </TextButton>
            </Grid>
          ))}
        </Grid>
        <AllergyModal
          allergyModel={(patientModel.get('allergies').findWhere({ _id: itemId }) || new AllergyModel())}
          patientModel={patientModel}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
        />
      </React.Fragment>
    );
  }
}
