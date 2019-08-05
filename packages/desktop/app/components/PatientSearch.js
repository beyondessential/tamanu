import React from 'react';
import Collapse from '@material-ui/core/Collapse';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import { TextInput, DateDisplay } from '.';

const PatientRow = React.memo(({ _id, name, dateOfBirth, sex, onClick }) => (
  <TableRow onClick={() => onClick(_id)} style={{ marginTop: '1rem' }}>
    <TableCell>{name}</TableCell>
    <TableCell>{sex}</TableCell>
    <TableCell>
      <DateDisplay date={dateOfBirth} showDuration />
    </TableCell>
    <TableCell>{_id}</TableCell>
  </TableRow>
));

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

    const rows =
      suggestions.length > 0 ? (
        suggestions.map(s => <PatientRow {...s} key={s._id} onClick={() => onPatientSelect(s)} />)
      ) : (
        <TableRow>
          <TableCell colSpan="4" align="center">
            No patients found.
          </TableCell>
        </TableRow>
      );

    return (
      <div>
        <TextInput label="Patient name" value={searchTerm} onChange={this.updateSearchTerm} />
        <Collapse in={expanded}>
          <Table>
            <TableHead>
              <TableCell>Name</TableCell>
              <TableCell>Sex</TableCell>
              <TableCell>Date of birth</TableCell>
              <TableCell>ID</TableCell>
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </Collapse>
      </div>
    );
  }
}
