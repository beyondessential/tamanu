import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { capitalize } from 'lodash';
import NoteModal from '../components/NoteModal';
import { dateFormat } from '../../../constants';
import { NewButton } from '../../../components';

class History extends Component {
  state = {
    noteModalVisible: false,
    history: []
  }

  componentWillMount() {
    const { model: Model } = this.props;
    const history = Model.getHistory();
    this.setState({ history });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const history = Model.getHistory();
    this.setState({ history });
  }

  onCloseModal = () => {
    this.setState({ noteModalVisible: false });
  }

  gotoItem = (item) => {
    const { docType, _id } = item;
    const { model: Model } = this.props;
    switch (docType) {
      default:
      case 'visit':
        this.props.history.push(`/patients/visit/${Model.id}/${_id}`);
      break;
      case 'medication':
        this.props.changeTab('medication');
      break;
    }
  }

  render() {
    const { model: Model } = this.props;
    const { noteModalVisible, history } = this.state;
    return (
      <div>
        <div className="column has-text-right">
          <NewButton
            onClick={() => this.setState({ noteModalVisible: true })}
            can={{ do: 'create', on: 'note' }}
          >Add Note </NewButton>
        </div>
        <div className="column">
          {
            history.map(item => {
              switch (item.docType) {
                default:
                case 'visit':
                  return (
                    <div className="history-pane m-b-25" key={`history-${item._id}`}>
                      <div className="header" onClick={() => this.gotoItem(item)}>
                        <span>
                        {
                          `${moment(item.startDate).format(dateFormat)} ${(item.endDate != null ? ` - ${moment(item.endDate).format(dateFormat)}` : '')}`
                        }
                        </span>
                        {capitalize(item.visitType)}
                        <span className="has-text-grey-lighter has-background-white-ter is-pulled-right m-r-0">Visit</span>
                      </div>
                      {item.procedures.length > 0 &&
                        <div className="text">
                          {
                            item.procedures.map(procedure => {
                              return (
                                <Fragment key={`procedure-${procedure._id}`}>
                                  <span>Procedure</span><br />
                                  <Link to={`/patients/visit/${Model.id}/${item._id}/procedure/${procedure._id}`}>
                                    {`${moment(procedure).format(dateFormat)}: ${procedure.description}`}
                                  </Link>
                                </Fragment>
                              );
                            })
                          }
                        </div>
                      }
                    </div>
                  );
                case 'medication':
                  return (
                    <div className="history-pane m-b-25" key={`history-${item._id}`}>
                      <div className="header" onClick={() => this.gotoItem(item)}>
                        <span>
                        {
                          `${moment(item.prescriptionDate).format(dateFormat)} ${(item.endDate != null ? ` - ${moment(item.endDate).format(dateFormat)}` : '')}`
                        }
                        </span>
                        {capitalize(item.drug.name)}
                        <span className="has-text-grey-lighter has-background-white-ter is-pulled-right m-r-0">Medication</span>
                      </div>
                      {/* {item.procedures.length > 0 &&
                        <div className="text">
                          {
                            item.procedures.map(procedure => {
                              return (
                                <Fragment key={`procedure-${procedure._id}`}>
                                  <span>Procedure</span><br />
                                  <Link to={`/patients/visit/${Model.id}/${item._id}/procedure/${procedure._id}`}>
                                    {`${moment(procedure).format(dateFormat)}: ${procedure.description}`}
                                  </Link>
                                </Fragment>
                              );
                            })
                          }
                        </div>
                      } */}
                    </div>
                  );
              }
            })
          }
        </div>
        <NoteModal
          isVisible={noteModalVisible}
          onClose={this.onCloseModal}
          patientModel={Model}
          action="new"
          showVisits
          little
        />
        {/* <NoteModal
          itemId={itemId}
          model={Model}
          patientModel={patientModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        /> */}
      </div>
    );
  }
}

export default History;
