import React from 'react';
import { View } from 'react-native-plus';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import _ from 'lodash';

import styles from './styles.scss';

@withRouter
export default class Header extends React.PureComponent {

  static defaultProps = {
    class: 'Header',
  };

  static propTypes = {
    class: PropTypes.string,
    history: PropTypes.object,
    className: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
    ]),
    backTo: PropTypes.string,
  };

  render() {
    const {
      className,
      children,
      backTo,
    } = this.props;

    return (
      <View className={`header ${styles} ${className || ''}`}>
        {typeof backTo === 'string' ?
          <View
            className="back"
            onClick={() => {
              this.props.history.goBack(backTo);
            }}
          >&#xe646;</View>
          : ''
        }
        {children}
      </View>
    );
  }
}
