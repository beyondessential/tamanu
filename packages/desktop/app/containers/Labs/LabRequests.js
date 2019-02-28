import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty, head } from 'lodash';
import ReactTable from 'react-table';
import { toast } from 'react-toastify';
import { Button, SyncIconButton, TopBar } from '../../components';
import { LabRequestsCollection } from '../../collections';
import { HospitalModel } from '../../models';

const columns = [
  { Header: 'Status', accessor: 'status' },
  { Header: 'Patient name', accessor: 'patient.displayName' },
  { Header: 'Requested by', accessor: 'requestedBy.displayName' },
  { Header: 'Date', accessor: 'requestedDate' },
  { Header: 'Actions', accessor: '_id' },
];

export class LabRequests extends Component {

  state = {
    keyword: '',
    tableClass: '',
    tableState: {},
    loading: true,
  }

  collection = new LabRequestsCollection();

  onFetchData = async (state = {}) => {
    const { keyword } = this.state;
    const updates = { loading: true };
    if (!isEmpty(state)) updates.tableState = state;
    this.setState(updates);

    try {
      // Set pagination options
      if (keyword) {
        this.collection.setKeyword(keyword);
      } else {
        this.collection.setKeyword('');
      }

      await this.collection.getPage(
        0,
        undefined,
        undefined,
        {
          pageSize: 10,
        }
      );
      this.setState({ loading: false });
    } catch (err) {
      this.setState({ loading: false });
      console.error(err);
    }
  }

  async componentDidMount() {
    this.collection.on('update', this.handleChange());
    this.onFetchData();
  }

  componentWillUnmount() {
    this.collection.off('update', this.handleChange());
  }

  handleChange() {
    const items = this.collection.models
      .map(model => {
        const { attributes } = model;
        console.log(attributes);
      });

    this.forceUpdate();
  }

  render() {
    const { tableClass, loading } = this.state;
    const items = this.collection.models.map(m => m.attributes);
    return (
      <div className="content">
        <TopBar title="Lab Requests" />
        <div className="detail">
          {items.length === 0 && !loading && // Loaded and no records
            <div className="notification">
              <span>
                No requests found. <Link to="/patients/edit/new">Create a new patient record?</Link>
              </span>
            </div>
          }
          {(items.length > 0 || loading) && // Loading or there's records
            <div>
              <ReactTable
                manual
                keyField="_id"
                data={items}
                pages={this.collection.state.totalPages}
                defaultPageSize={10}
                loading={this.state.loading}
                columns={columns}
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}
