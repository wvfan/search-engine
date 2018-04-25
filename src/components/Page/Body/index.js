import React from 'react';
import { View } from 'react-native-plus';
import PropTypes from 'prop-types';
import _ from 'lodash';

export default class Body extends React.PureComponent {

  static defaultProps = {
    class: 'Body',
  };

  static propTypes = {
    class: PropTypes.string,
    className: PropTypes.string,
    wHeader: PropTypes.bool,
    onScroll: PropTypes.func,
  };

  static contextTypes = {
    systemActions: PropTypes.object,
  };

  constructor() {
    super();
    this.class = 'Body';
  }

  render() {
    const {
      className,
      wHeader,
    } = this.props;

    return (
      <View
        ref={(ref) => {
          if (!ref || !ref.ref) return;
          this.context.systemActions.update({
            scrollTop: ref.ref.scrollTop,
            scrollLeft: ref.ref.scrollLeft,
          });
        }}
        className={`body absolute-parent ${wHeader ? 'body-withHeader' : ''} ${className || ''}`}
        {..._.omit(this.props, ['className', 'wHeader'])}
        onScroll={(evt) => {
          this.context.systemActions.update({
            scrollTop: evt.target.scrollTop,
            scrollLeft: evt.target.scrollLeft,
          });
          if (this.props.onScroll) this.props.onScroll(evt);
        }}
      />
    );
  }
}
