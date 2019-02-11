import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Zoom from '@material-ui/core/Zoom';
import styled from 'styled-components';
import { ButtonBase } from '.';

const FabBottomRight = styled(Fab)`
  position: fixed !important;
  right: 20px !important;
  bottom: 20px !important;
`;

const QuickLinksItem = ({ to, text, key, children, ...props }) =>
  <MenuItem
    key={key}
    component={ ButtonBase }
    to={to}
    {...props}
  >{text || children}</MenuItem>

class QuickLinks extends Component {
  static defaultProps = {
    key: 'quick-links'
  };

  state = {
    anchorEl: null
  }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { links, key } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <React.Fragment>
        <Zoom in>
          <FabBottomRight color="primary" onClick={this.handleClick}>
            <AddIcon />
          </FabBottomRight>
        </Zoom>
        <Menu
          id={`${key}-m`}
          anchorEl={anchorEl}
          open={open}
          onClose={this.handleClose}
        >{links.map((link, itemKey) => <QuickLinksItem
                                          key={`${key}-i-${itemKey}`}
                                          {...link}
                                        />)}</Menu>
      </React.Fragment>
    );
  }
};

QuickLinks.propTypes = {
  links: PropTypes.array.isRequired,
  key: PropTypes.string,
};

export default QuickLinks;