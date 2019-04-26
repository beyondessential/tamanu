import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { Grid, Typography } from '@material-ui/core';
import ConditionModal from './ConditionModal';
import { dateFormat } from '../../../constants';
import { TextButton } from '../../../components';
import { ConditionModel, PatientModel } from '../../../models';

export default class Condition extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
  }

  state = {
    modalVisible: false,
    conditionModel: new ConditionModel(),
  }

  componentWillMount() {
    const { patientModel } = this.props;
    const { conditions } = patientModel.attributes;
    this.setState({ conditions });
  }

  componentWillReceiveProps(newProps) {
    const { patientModel } = newProps;
    const { conditions } = patientModel.attributes;
    this.setState({ conditions });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editItem = (itemId = null) => () => {
    const { patientModel } = this.props;
    let { conditionModel } = this.state;
    const item = patientModel.get('conditions').findWhere({ _id: itemId });
    if (!isEmpty(item)) {
      conditionModel = item;
    } else {
      conditionModel = new ConditionModel();
    }
    this.setState({
      modalVisible: true,
      conditionModel,
    });
  }

  render() {
    const { patientModel } = this.props;
    const {
      modalVisible,
      conditionModel,
      conditions,
    } = this.state;
    return (
      <React.Fragment>
        <Grid container item spacing={8}>
          <Grid item>
            <Typography variant="body2">
              Ongoing Conditions
            </Typography>
          </Grid>
          <Grid item>
            <TextButton
              can={{ do: 'create', on: 'condition' }}
              onClick={this.editItem()}
            >
              + Add Condition
            </TextButton>
          </Grid>
          <Grid item xs={12} style={{ paddingTop: 0 }}>
            {conditions.map((model, k) => {
              const { _id, condition, date } = model.toJSON();
              return (
                <React.Fragment key={_id}>
                  {k > 0 ? ', ' : ''}
                  <TextButton
                    can={{ do: 'read', on: 'condition' }}
                    onClick={this.editItem(_id)}
                  >
                    {`${condition} (${moment(date).format(dateFormat)})`}
                  </TextButton>
                </React.Fragment>
              );
            })}
          </Grid>
          <ConditionModal
            conditionModel={conditionModel}
            patientModel={patientModel}
            isVisible={modalVisible}
            onClose={this.onCloseModal}
            little
          />
        </Grid>
      </React.Fragment>
    );
  }
}
