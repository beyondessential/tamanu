import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';

import { Colors, pageSizes } from '../../../constants';
import { PregnanciesCollection } from '../../../collections';
import DeletePregnancyModal from './components/DeletePregnancyModal';

class Pregnancy extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    deleteModalVisible: false,
    selectedPregnancy: null,
    pageSize: pageSizes.pregnancies
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.props.collection.setPageSize(this.state.pageSize);
    this.props.collection.fetchResults();
  }

  componentWillReceiveProps({ deletepregnanciesuccess }) {
    if (deletepregnanciesuccess) {
      this.props.collection.fetchResults();
    }
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
  }

  goView = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  goAdmit = () => {
    this.props.history.push('/programs/prepregnancies');
  }

  showDeleteModal = (pregnancy) => {
    this.setState({
      deleteModalVisible: true,
      selectedPregnancy: pregnancy
    });
  }

  onCloseModal = () => {
    this.setState({ deleteModalVisible: false });
  }

  onDeletePregnancy = () => {
    let { selectedPregnancy } = this.state;
    selectedPregnancy = this.props.collection.findWhere({ _id: selectedPregnancy._id });
    if (!isEmpty(selectedPregnancy)) {
      selectedPregnancy.destroy({
        wait: true,
        success: () => this.onCloseModal()
      });
    }
  }

  onFetchData = (state) => {
    this.props.collection.setPage(state.page);
    this.props.collection.setPageSize(state.pageSize);

    this.setState({ loading: true });
    this.props.collection.fetchResults({
      success: () => {
        this.setState({ loading: false });
      }
    });
  }

  render() {
    const { deleteModalVisible } = this.state;
    const that = this;
    let { models: pregnancies } = this.props.collection;
    if (pregnancies.length > 0) pregnancies = map(pregnancies, pregnancy => pregnancy.attributes);
    const pregnancyColumns = [{
      accessor: 'displayId',
      Header: 'Id',
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
      accessor: 'firstName',
      Header: 'First Name',
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
      accessor: 'lastName',
      Header: 'Last Name',
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
      accessor: 'sex',
      Header: 'Sex',
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
      accessor: 'birthday',
      Header: 'DOB',
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
      accessor: 'patientStatus',
      Header: 'Status',
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
      id: 'actions',
      Header: 'Actions',
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
      minWidth: 350,
      Cell: row => {
        return (
          <div key={row._id}>
            <button className="button column-button" onClick={() => that.goView(row.value._id)}>View Patient</button>
            <button className="button is-primary column-checkin-button" onClick={() => that.goAdmit()}>Admit</button>
            <button className="button is-danger column-button" onClick={() => that.showDeleteModal(row)}>Delete</button>
          </div>
        );
      }
    }];
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
          <div className="view-action-buttons">
            <Link to="/Pregnancy/edit/new">
              + New Pregnancy
            </Link>
          </div>
        </div>
        <div className="detail">
          {pregnancies.length === 0 ?
            <div className="notification">
              <span>
                No pregnancies found. <Link to="/patients/edit/new">Create a new pregnancies record?</Link>
              </span>
            </div>
            :
            <div>
              <ReactTable
                manual
                keyField="_id"
                data={pregnancies}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.pregnancies}
                loading={this.state.loading}
                columns={pregnancyColumns}
                className="-striped"
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
              />
            </div>
          }
        </div>
        <DeletePregnancyModal
          isVisible={deleteModalVisible}
          onClose={this.onCloseModal}
          onDelete={this.onDeletePatient}
          little
        />
      </div>
    );
  }
}

Pregnancy.defaultProps = {
  collection: new PregnanciesCollection(),
  pregnancies: []
};

export default Pregnancy;
