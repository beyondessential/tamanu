import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import ConditionModal from './ConditionModal';
import { dateFormat } from '../../../constants';
import { TextButton } from '../../../components';
import { ConditionModel } from '../../../models';

class Condition extends Component {
  static propTypes = {
    patientModel: PropTypes.object.isRequired,
  }

  state = {
    modalVisible: false,
    action: 'new',
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

  editItem(itemId = null) {
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
      action: isEmpty(item) ? 'new' : 'update',
      conditionModel,
    });
  }

  render() {
    const { patientModel } = this.props;
    const {
      modalVisible,
      action,
      conditionModel,
      conditions,
    } = this.state;

    return (
      <div>
        <div className="column p-b-0">
          <span className="title"> Ongoing Conditions </span>
          <TextButton
            can={{ do: 'create', on: 'condition' }}
            onClick={() => this.editItem()}
          >
            {' '}
+ Add Condition
            {' '}
          </TextButton>
          <div className="clearfix" />
          {conditions.map((model, k) => {
            const { _id, condition, date } = model.toJSON();
            return (
              <React.Fragment key={_id}>
                {k > 0 ? ', ' : ''}
                <TextButton
                  can={{ do: 'read', on: 'condition' }}
                  onClick={() => this.editItem(_id)}
                >
                  {`${condition} (${moment(date).format(dateFormat)})`}
                </TextButton>
              </React.Fragment>
            );
          })}
        </div>
        <ConditionModal
          conditionModel={conditionModel}
          patientModel={patientModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Condition;
