import React, { Component } from 'react';
import ReactTable from 'react-table';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

import { Notification } from './Notification';

const defaultTransformRow = model => model.toJSON();

export class BrowsableTable extends Component {

  static propTypes = {
    transformRow: PropTypes.func,
  }

  static defaultProps = {
    transformRow: defaultTransformRow,
  }

  state = {
    tableClass: '',
    tableState: {},
    loading: true,
  }

  onFetchData = async (state = {}) => {
    const { collection } = this.props;
    const updates = { loading: true };
    if (!isEmpty(state)) updates.tableState = state;
    this.setState(updates);

    try {
      // Set sorting options
      // TODO: investigate support for multiple sort keys
      // (currently this will just use the most recent one)
      if(state.sorted) {
        state.sorted.map(s => collection.setSorting(s.id, s.desc ? 1 : -1));
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
    const { collection, columns, emptyNotification, transformRow } = this.props;
    const { tableClass, loading } = this.state;
    // transform data
    const items = collection.models.map(transformRow);

    if (items.length === 0 && !loading) {
      return <Notification message={emptyNotification} />;
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
