import React from 'react';
import { View, Text } from 'react-native-plus';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import _ from 'lodash';

import page from 'decorators/page';

import Page, { Body, Subpages, EmptyRoute } from 'components/Page';

import { styles } from './styles.scss';

import Index from './Index/index';
import Client from './Client';

@page({
  path: '/',
})
@observer
export default class Root extends React.Component {

  static propTypes = {
    history: PropTypes.object,
  }

  render() {
    return (
      <Page styles={styles}>
        <Body>
          <Subpages>
            <Index />
            <Client />
          </Subpages>
        </Body>
      </Page>
    );
  }
}
