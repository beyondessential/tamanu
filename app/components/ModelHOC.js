import React, { Component } from 'react';

export const withSubscription = (WrappedComponent) => {
  // ...and returns another component...
  return class extends Component {
    constructor(props) {
      super(props);
      this.handleChange = this.handleChange.bind(this);
      // console.log('__this.props__', this.props);
      // this.state = {
      //   data: selectData(DataSource, props)
      // };
    }

    componentDidMount() {
      // console.log('_parent_componentDidMount_');
      // ... that takes care of the subscription...
      // DataSource.addChangeListener(this.handleChange);
    }

    componentWillUnmount() {
      // console.log('_parent_componentWillUnmount_');
      // DataSource.removeChangeListener(this.handleChange);
    }

    // handleChange() {
    //   this.setState({
    //     data: selectData(DataSource, this.props)
    //   });
    // }

    render() {
      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      return <WrappedComponent {...this.props} />;
    }
  };
}
