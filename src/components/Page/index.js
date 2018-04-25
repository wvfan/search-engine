import React from 'react';
import { View, combineStyles } from 'react-native-plus';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Header from './Header';
import Body from './Body';
import Subpages from './Subpages';
import EmptyRoute from './Subpages/EmptyRoute';

import { styles } from './styles.scss';

export { Header, Body, Subpages, EmptyRoute };

export default class Page extends React.PureComponent {

  static defaultProps = {
    class: 'Page',
  };

  static propTypes = {
    class: PropTypes.string,
    className: PropTypes.string,
    styles: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    children: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
    ]),
  };

  render() {
    const { className } = this.props;
    const stylesI = this.props.styles;
    let {
      children,
    } = this.props;
    if (!(children instanceof Array)) children = [children];
    if (!children[0]) children = null;

    let wHeader = false;
    _.each(children, (child) => {
      if (child.props.class === 'Header') {
        wHeader = true;
        return false;
      }
    });

    return (
      <View
        className={`page absolute-parent ${className || ''}`}
        styles={combineStyles(styles, stylesI)}
        {..._.omit(this.props, ['path', 'className', 'styles'])}
      >
        {React.Children.map(children, (child) => {
          const className = child.props.class;
          if (className === 'Body') {
            return React.cloneElement(child, {
              wHeader,
            });
          }
          return child;
        })}
      </View>
    );
  }
}
