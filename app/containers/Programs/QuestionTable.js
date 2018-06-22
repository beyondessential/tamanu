import React, { Component } from 'react';
import ReactTable from 'react-table';
import { map, isEmpty } from 'lodash';
import { Colors } from '../../constants';
import { AppointmentCollection } from '../../collections';

class QuestionTable extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    deleteModalVisible: false,
    selectedAppointment: null,
    pageSize: 5
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.props.collection.setPageSize(this.state.pageSize);
    this.props.collection.fetchResults();
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
  }

  onFetchData = (state) => {
    this.props.collection.setPage(state.page);
    this.props.collection.setPageSize(state.pageSize);

    // this.setState({ loading: true });
    this.props.collection.fetchResults({
      success: () => {
        // this.setState({ loading: false });
      }
    });
  }

  showDeleteModal = (appointment) => {
    this.setState({
      deleteModalVisible: true,
      selectedAppointment: appointment
    });
  }

  onCloseModal = () => {
    this.setState({ deleteModalVisible: false });
  }

  onDeleteAppointment = () => {
    let { selectedAppointment } = this.state;
    selectedAppointment = this.props.collection.findWhere({ _id: selectedAppointment._id });
    if (!isEmpty(selectedAppointment)) {
      selectedAppointment.destroy({
        wait: true,
        success: () => this.onCloseModal()
      });
    }
  }

  showAntenatal = () => {
    this.props.history.push('/programs/pregnancyConfirm');
  }

  render() {
    const that = this;
    const { deleteModalVisible } = this.state;
    let { models: appointments } = this.props.collection;
    if (appointments.length > 0) appointments = map(appointments, appointment => appointment.attributes);
    const appointmentColumns = [{
      accessor: 'date',
      Header: 'Date',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'urinalysis',
      Header: 'Urinalysis Pro/sug',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'bp',
      Header: 'BP',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: 'aog',
      Header: 'AOG',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'fh',
      Header: 'FH',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: 'fetallie',
      Header: 'Fetal lie',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: row => {
        return { _id: row._id, admitted: row.admitted };
      },
      id: 'fetalheart',
      Header: 'Fetal heart',
      headerStyle: {
        backgroundColor: Colors.searchTintColor
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 250
    }];
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
        </div>
        <div className="question-table-details">
          <div className="columns title">
            <div className="question-name">
              <span className="question-name-title">
                Name
              </span>
              <span className="question-name-details">
                Jo Citizon
              </span>
            </div>
            <button className="button is-primary pregnancys-antenatal-button" onClick={this.showAntenatal.bind(this)}>Antenatal Visit</button>
          </div>
          <ReactTable
            manual
            keyField="_id"
            data={appointments}
            pages={this.props.collection.totalPages}
            defaultPageSize={5}
            // loading={this.state.loading}
            columns={appointmentColumns}
            className="-striped"
            defaultSortDirection="asc"
            onFetchData={this.onFetchData}
          />
          <div className="question-table-buttons">
            <button className="button is-primary question-table-button" onClick={this.showAntenatal.bind(this)}>Gestational diabetes</button>
            <button className="button is-danger question-table-button" onClick={this.showAntenatal.bind(this)}>Finish Visit</button>
          </div>
        </div>
      </div>
    );
  }
}

QuestionTable.defaultProps = {
  collection: new AppointmentCollection(),
  appointments: []
};

export default QuestionTable;
