/**
 * @providesModule react-native-plus
 */

import View from './View';
import Text from './Text';
import InputText from './InputText';

import combineStyles from './combineStyles';
import { defValueGetter, defValueSetter } from './defValuer';

let env = 'web';

export {
  View,
  Text,
  InputText,
  combineStyles,
  defValueGetter,
  defValueSetter,
};

export function setEnv(envC) {
  env = envC;
}
