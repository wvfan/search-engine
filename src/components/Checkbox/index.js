import React from 'react';
import { View, Text, defValueGetter, defValueSetter } from 'react-native-plus';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import _ from 'lodash';

import withClass from 'decorators/withClass';

import styleVariables from 'styles/variables';

import { styles } from './styles.scss';

@withClass('Checkbox')
@observer
export default class Checkbox extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    state: PropTypes.object,
    actions: PropTypes.object,
    field: PropTypes.string,
    text: PropTypes.string,
    boxPos: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    valueGetter: PropTypes.func,
    valueSetter: PropTypes.func,
  };

  static contextTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
  };

  render() {
    const {
      state = this.context.state,
      actions = this.context.actions,
      className = '',
      field,
      text,
      boxPos = 'left',
      size = 16,
      color = styleVariables.primary,
      valueGetter = defValueGetter,
      valueSetter = defValueSetter,
    } = this.props;
    const wSelected = valueGetter(state, field);

    return (
      <View
        className={`checkbox ${className}`}
        styles={styles}
      >
        {boxPos === 'right' ?
          <View className="text">
            <Text>{text}</Text>
          </View> : ''
        }
        <View
          className="box"
          style={{
            width: size * 1.2,
            height: size * 1.2,
            marginLeft: boxPos === 'left' ? 0 : size * 0.5,
            marginRight: boxPos === 'right' ? 0 : size * 0.5,
            borderRadius: size * 0.3,
            boxShadow: `inset 0 0 0 ${size * 0.15}px ${styleVariables.lesserGray}`,
          }}
          onClick={() => {
            valueSetter(!wSelected, actions, field);
          }}
        >
          <View className="cover absolute-parent" />
          <View
            className={`tick ${!wSelected ? 'tick-hide' : ''}`}
            style={{
              marginLeft: size * 0.1,
              color,
              fontSize: size,
            }}
          >&#xe643;</View>
        </View>
        {boxPos === 'left' ?
          <View className="text">
            <Text>{text}</Text>
          </View> : ''
        }
      </View>
    );
  }
}
