import React from 'react';
import { defValueGetter, defValueSetter } from 'react-native-plus';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import withClass from 'decorators/withClass';
import autobind from 'auto-bind';
import _ from 'lodash';

@withClass('InputText')
@observer
export default class InputText extends React.PureComponent {

  static propTypes = {
    className: PropTypes.string,
    onRef: PropTypes.func,
    field: PropTypes.string,
    valueGetter: PropTypes.func,
    valueSetter: PropTypes.func,
    onChange: PropTypes.func,
  }

  static contextTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
  };

  constructor() {
    super();
    autobind(this);
  }

  componentWillMount() {
    if (this.props.onRef) this.props.onRef(this);
  }

  getValue() {
    return this.context.state[this.props.field];
  }

  render() {
    const {
      field,
      valueGetter = defValueGetter,
      valueSetter = defValueSetter,
    } = this.props;
    const {
      state,
      actions,
    } = this.context;
    const value = valueGetter(state, field);

    return (
      <input
        {..._.omit(this.props, ['onRef', 'class', 'field'])}
        className={`input-text ${this.props.className || ''}`}
        value={value}
        onChange={(evt) => {
          valueSetter(evt.target.value, actions, field);
          if (this.props.onChange) this.props.onChange(evt);
        }}
      />
    );
  }
}
