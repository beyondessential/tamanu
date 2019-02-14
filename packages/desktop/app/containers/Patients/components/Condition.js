import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import ConditionModal from './ConditionModal';
import { dateFormat } from '../../../constants';
import { TextButton} from '../../../components';
import { ConditionModel } from '../../../models';

class Condition extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
  }

  state = {
    modalVisible: false,
    action: 'new',
    itemModel: new ConditionModel()
  }

  componentWillMount() {
    const { model: Model } = this.props;
    const { conditions } = Model.attributes;
    this.setState({ conditions });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const { conditions } = Model.attributes;
    this.setState({ conditions });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editItem( itemId = null ) {
    const { model: Model } = this.props;
    let { itemModel } = this.state;
    const item = Model.get('conditions').findWhere({ _id: itemId });
    if (!isEmpty(item)) {
      itemModel = item
    } else {
      itemModel = new ConditionModel()
    }
    this.setState({
      modalVisible: true,
      action: isEmpty(item) ? 'new' : 'update',
      itemModel
    });
  }

  render() {
    const { model: Model } = this.props;
    const {
      modalVisible,
      action,
      itemModel,
      conditions
    } = this.state;

    return (
      <div>
        <div className="column p-b-0">
          <span className="title"> Ongoing Conditions </span>
          <TextButton
            can={{ do: 'create', on: 'condition' }}
            onClick={() => this.editItem()}
          > + Add Condition </TextButton>
          <div className="clearfix" />
          {conditions.map((conditionModel, k) => {
            const { _id, condition, date } = conditionModel.toJSON();
            return (
              <React.Fragment key={condition._id}>
                {k > 0 ? ', ' : ''}
                <TextButton
                  can={{ do: 'read', on: 'condition' }}
                  onClick={() => this.editItem(_id)}
                >{`${condition} (${moment(date).format(dateFormat)})`}</TextButton>
              </React.Fragment>
            );
          })}
        </div>
        <ConditionModal
          model={itemModel}
          patientModel={Model}
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
