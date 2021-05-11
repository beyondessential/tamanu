import React from 'react';
import Collapse from '@material-ui/core/Collapse';

import { Table } from './Table';
import { useFlags } '../contexts/FeatureFlags';

import { TextInput, DateDisplay } from '.';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} showDuration />);

const getColumns = getFlag => [
  { key: 'firstName', title: 'First Name' },
  { key: 'lastName', title: 'Last Name' },
  { key: 'sex', title: 'Sex' },
  { key: 'dateOfBirth', title: 'Date of Birth', CellComponent: DateOfBirthCell },
  { key: 'displayId', title: getFlag('patientFieldOverrides.displayId.shortLabel') },
];

export class PatientAutocomplete extends React.PureComponent {
  state = {
    searchTerm: '',
    suggestions: [],
    expanded: false,
  };

  updateSearchTerm = async ({ target }) => {
    const { suggester } = this.props;
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
    const { getFlag } = useFlags();

    return (
      <div>
        <TextInput label="Patient name" value={searchTerm} onChange={this.updateSearchTerm} />
        <Collapse in={expanded}>
          <Table
            columns={getColumns(getFlag)}
            data={suggestions}
            onRowClick={onPatientSelect}
            noDataMessage="No patients found matching your search"
          />
        </Collapse>
      </div>
    );
  }
}
