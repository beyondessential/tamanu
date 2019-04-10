import React, { Component } from 'react';
import { pull } from 'lodash';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Grid, Typography, Chip } from '@material-ui/core';
import { NewButton, TextInput } from '../../../components';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';

const ChipWithMargin = styled(Chip)`
  margin-right: ${spacing * 2}px;
`;

export default class ActionTaken extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
  }

  state = {
    actionTaken: '',
    actionsTaken: [],
  }

  componentDidMount() {
    this.handleProps();
  }

  componentWillReceiveProps(newProps) {
    this.handleProps(newProps);
  }

  handleInput = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }

  addActionTaken = () => {
    const { actionsTaken, actionTaken } = this.state;
    const { onChange } = this.props;
    actionsTaken.push(actionTaken);
    this.setState({ actionsTaken, actionTaken: '' }, () => {
      onChange(actionsTaken, 'actionsTaken');
    });
  }

  removeActionTaken = (value) => () => {
    let { actionsTaken } = this.state;
    const { onChange } = this.props;
    actionsTaken = pull(actionsTaken, value);
    this.setState({ actionsTaken, actionTaken: '' }, () => {
      onChange(actionsTaken, 'actionsTaken');
    });
  }

  handleProps(props = this.props) {
    const { actionsTaken } = props;
    this.setState({ actionsTaken });
  }

  render() {
    const { actionsTaken, actionTaken } = this.state;
    return (
      <Grid
        container
        spacing={spacing * 2}
        style={{ marginBottom: spacing * 2 }}
      >
        <Grid container item spacing={spacing * 2}>
          <Grid item md={8} xs>
            <TextInput
              name="actionTaken"
              label="Action"
              value={actionTaken}
              onChange={this.handleInput}
            />
          </Grid>
          <Grid container item md={4} alignItems="flex-end">
            <NewButton
              size="small"
              disabled={!actionTaken}
              onClick={this.addActionTaken}
            >
              Add Action
            </NewButton>
          </Grid>
        </Grid>
        {actionsTaken && actionsTaken.length > 0
          && (
            <Grid
              container
              item
              spacing={spacing * 2}
              direction="column"
            >
              <Grid item>
                <Typography variant="subtitle1">
                  Actions Taken
                </Typography>
              </Grid>
              <Grid item>
                {actionsTaken.map(actionTakenLabel => (
                  <ChipWithMargin
                    key={actionTakenLabel}
                    label={actionTakenLabel}
                    onDelete={this.removeActionTaken(actionTakenLabel)}
                  />
                ))}
              </Grid>
            </Grid>
          )
        }
      </Grid>
    );
  }
}
