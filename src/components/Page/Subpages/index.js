import React from 'react';
import { View } from 'react-native-plus';
import PropTypes from 'prop-types';
import * as mobx from 'mobx';
import { observer } from 'mobx-react';
import withClass from 'decorators/withClass';
import _ from 'lodash';

import temps from 'temps';
import store from 'store';
import { actions as pagesActions } from 'store/pages';

import { styles } from './styles.scss';

@withClass('Subpages')
@observer
export default class Subpages extends React.Component {

  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
    ]),
  };

  static contextTypes = {
    pagePath: PropTypes.string,
  };

  render() {
    const path = this.context.pagePath;
    const node = store.pages[path];
    const subpages = node.$system.subpages[this.key || '_def'];
    let { children } = this.props;
    if (!(children instanceof Array)) children = [children];
    if (!children[0]) return <View />;

    let { pageC } = subpages;
    let pageCPath = '';
    _.each(children, (child) => {
      if (!pageC || pageC === child.props.pagePath) {
        pageC = child;
        pageCPath = child.props.pagePath;
        return false;
      }
    });

    if (!temps.pages[path].subpages[this.key || '_def']) {
      requestAnimationFrame(() => {
        pagesActions.initSubpages({
          path,
          group: '_def',
          pageC: pageCPath,
          pages: children,
        });
      });
    }

    return (
      <View className={`subpages ${pageC.props.class === 'EmptyRoute' ? 'subpages-empty' : ''} ${styles}`}>
        {React.Children.map(children, (child, index) => {
          return React.cloneElement(child, {
            wShow: pageC === child,
          });
        })}
      </View>
    );
  }
}
