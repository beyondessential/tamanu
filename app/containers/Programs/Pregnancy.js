import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';

import { Colors, pageSizes } from '../../constants';
import { PregnancysCollection } from '../../collections';
import DeletePregnancyModal from './components/DeletePregnancyModal';

class Pregnancy extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    deleteModalVisible: false,
    selectedPregnancy: null,
    pageSize: pageSizes.pregnancys
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.props.collection.setPageSize(this.state.pageSize);
    this.props.collection.fetchResults();
  }

  componentWillReceiveProps({ deletePregnancySuccess }) {
    if (deletePregnancySuccess) {
      this.props.collection.fetchResults();
    }
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
  }

  goEdit = (pregnancyId) => {
    this.props.history.push(`/pregnancys/editPregnancy/${pregnancyId}`);
  }

  goAdmit = (pregnancyId, pregnancy) => {
    console.log('aaa', pregnancyId);
    if (pregnancy.admitted) {
      this.props.history.push(`/programs/pregnancyVisit/${pregnancyId}`);
    } else {
      this.props.history.push(`/programs/pregnancyVisit/${pregnancyId}`);
    }
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
    let { models: pregnancys } = this.props.collection;
    if (pregnancys.length > 0) pregnancys = map(pregnancys, pregnancy => pregnancy.attributes);
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
      minWidth: 250,
      Cell: row => {
        return (
          <div key={row._id}>
            <button className="button column-button" onClick={() => that.goEdit(row.value._id)}>Edit</button>
            <button className="button is-primary column-checkin-button" onClick={() => that.goAdmit(row.value._id, row.value.admitted)}>{row.value.admitted ? 'Discharge' : 'Admit'}</button>
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
          {pregnancys.length === 0 ?
            <div className="notification">
              <span>
                No Pregnancys found. <Link to="/patients/edit/new">Create a new Pregnancys record?</Link>
              </span>
            </div>
            :
            <div>
              <ReactTable
                manual
                keyField="_id"
                data={pregnancys}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.pregnancys}
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
  collection: new PregnancysCollection(),
  Pregnancys: []
};

export default Pregnancy;
