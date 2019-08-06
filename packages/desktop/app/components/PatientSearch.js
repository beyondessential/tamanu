import React from 'react';
import Collapse from '@material-ui/core/Collapse';

import { Table } from './Table';

import { TextInput, DateDisplay } from '.';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} showDuration />);

const COLUMNS = [
  { key: 'name', title: 'Name' },
  { key: 'sex', title: 'Sex' },
  { key: 'dateOfBirth', title: 'Date of Birth', CellComponent: DateOfBirthCell },
  { key: '_id', title: 'ID' },
];

export class PatientSearch extends React.PureComponent {
  state = {
    searchTerm: '',
    suggestions: [],
    expanded: false,
  };

  updateSearchTerm = async ({ target }) => {
    const suggester = this.props.suggester;
    const searchTerm = target.value;
    this.setState({
      searchTerm,
    });

    if (searchTerm.length > 0) {
      const suggestions = await suggester.fetchSuggestions(searchTerm);
      this.setState(state => ({
        suggestions,
        expanded: state.expanded || suggestions.length > 0,
      }));
    } else {
      this.setState({ expanded: false });
    }
  };

  render() {
    const { onPatientSelect } = this.props;
    const { searchTerm, suggestions, expanded } = this.state;

    return (
      <div>
        <TextInput label="Patient name" value={searchTerm} onChange={this.updateSearchTerm} />
        <Collapse in={expanded}>
          <Table
            columns={COLUMNS}
            data={suggestions}
            onRowClick={onPatientSelect}
            noDataMessage="No patients found matching your search"
          />
        </Collapse>
      </div>
    );
  }
}
