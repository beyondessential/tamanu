import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import DiagnosisModal from './DiagnosisModal';
import { dateFormat } from '../../../constants';
import { TextButton} from '../../../components';
import { DiagnosisModel } from '../../../models';

class Diagnosis extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    showSecondary: PropTypes.bool,
  }

  static defaultProps = {
    showSecondary: false
  }

  state = {
    modalVisible: false,
    action: 'new',
    itemModel: new DiagnosisModel()
  }

  componentWillMount() {
    const { model } = this.props;
    const { diagnoses } = model.attributes;
    this.setState({ diagnoses });
  }

  componentWillReceiveProps(newProps) {
    const { model } = newProps;
    const { diagnoses } = model.attributes;
    this.setState({ diagnoses });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editItem( itemId = null ) {
    const { model } = this.props;
    let itemModel = model.get('diagnoses').findWhere({ _id: itemId });
    if (!itemModel) itemModel = new DiagnosisModel()
    this.setState({
      modalVisible: true,
      action: itemModel.id ? 'update' : 'new',
      itemModel
    });
  }

  render() {
    const {
      model,
      showSecondary
    } = this.props;
    const {
      modalVisible,
      action,
      itemModel,
      diagnoses: allDiagnoses
    } = this.state;
    // filter diagnosis type i-e primary or secondary
    const diagnoses = allDiagnoses.toJSON().filter(diagnosis => diagnosis.active && diagnosis.secondaryDiagnosis === showSecondary);

    return (
      <div>
        <div className={`column p-b-0 ${!diagnoses.length && showSecondary ? 'is-hidden' : ''}`}>
          <span className="title">{`${showSecondary ? 'Secondary' : 'Primary'} Diagnosis `}</span>
          <TextButton
            className={showSecondary ? 'is-hidden' : ''}
            can={{ do: 'create', on: 'diagnosis' }}
            onClick={() => this.editItem()}
          > + Add Diagnosis </TextButton>
          <div className="clearfix" />
          {diagnoses.map((diagnosis, k) => {
            return (
              <React.Fragment key={diagnosis._id}>
                {k > 0 ? ', ' : ''}
                <TextButton
                  can={{ do: 'read', on: 'diagnosis' }}
                  onClick={() => this.editItem(diagnosis._id)}
                >{`${diagnosis.diagnosis} (${moment(diagnosis.date).format(dateFormat)})`}</TextButton>
              </React.Fragment>
            );
          })}
        </div>
        <DiagnosisModal
          model={itemModel}
          parentModel={model}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Diagnosis;
