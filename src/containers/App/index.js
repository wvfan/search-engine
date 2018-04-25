import React from 'react';
import { View, Text } from 'react-native-plus';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import _ from 'lodash';

import run from 'helpers/run';
import getSearchs from 'helpers/getSearchs';
import modifyHistory from 'helpers/modifyHistory';
import { actions as systemActions } from 'store/system';
import { actions as pagesActions } from 'store/pages';

import 'styles/app.scss';

import Index from 'pages';

@withRouter
export default class App extends React.Component {

  static propTypes = {
    history: PropTypes.object,
    location: PropTypes.object,
  };

  componentWillMount() {
    modifyHistory(this.props.history);
    const href = window.location.href;
    const path = href.slice(href.indexOf('/', 7));
    systemActions.routeTo(path);
    pagesActions.routeTo(path);
  }

  componentWillReceiveProps(props) {
    if (props.location.pathname !== this.props.location.pathname) {
      this.props.history.dispatch(props.location.pathname);
    }
  }

  render() {
    return (
      <View className="absolute-parent">
        <Index />
      </View>
    );
  }
}
