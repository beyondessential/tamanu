import React, { Component } from 'react';
import ReactTable from 'react-table';

import { isEmpty } from 'lodash';

import { Notification } from './Notification';

export class BrowsableTable extends Component {

  state = {
    keyword: '',
    tableClass: '',
    tableState: {},
    loading: true,
  }

  onFetchData = async (state = {}) => {
    const { collection } = this.props;
    const { keyword } = this.state;
    const updates = { loading: true };
    if (!isEmpty(state)) updates.tableState = state;
    this.setState(updates);

    try {
      // Set pagination options
      if (keyword) {
        collection.setKeyword(keyword);
      } else {
        collection.setKeyword('');
      }

      await collection.getPage(
        state.page || 0,
        undefined,
        undefined,
        {
          pageSize: state.pageSize || 10,
        }
      );
      this.setState({ loading: false });
    } catch (err) {
      this.setState({ loading: false });
      console.error(err);
    }
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange());
    this.onFetchData();
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange());
  }

  handleChange() {
    this.forceUpdate();
  }

  render() {
    const { collection, columns, emptyNotification } = this.props;
    const { tableClass, loading } = this.state;
    const items = collection.models.map(m => m.attributes);

    if (items.length === 0 && !loading) {
      return <Notification message={emptyNotification} />
    }
    
    return (
      <ReactTable
        manual
        keyField="_id"
        data={items}
        pages={collection.state.totalPages}
        defaultPageSize={10}
        loading={loading}
        columns={columns}
        defaultSortDirection="asc"
        onFetchData={this.onFetchData}
      />
    );
  }
}
