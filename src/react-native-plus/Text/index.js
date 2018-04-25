/*

此组件用于多语言应用

state.lang.lang存储了当前使用的语言，对应Lang组件的props.lang

用法一：
  规定id，则组件会从constants中获取`LANG_TEXT[id]`，其中存有所有定义好的语言文字
  可于constants/lang.js中设置`LANG_TEXT`。为了方便，若不设置en属性，则将id作为en属性
  若找不到`constants.LANG_TEXT[id]`，则将id直接作为组件的en文字
  id中可使用分段符`，则组件会将id分成多段进行查找，适用于将短句组合成长句时使用。
  例：
    定义:
      LANG_TEXT={
        "a. 233":{
          zhT:"贰叁叁",
        },
      };
      <Lang id="a. 233"/>
    则对于此Lang组件：
      this.en="a. 233";
      this.zhT="贰叁叁";

用法二：
  直接定义组件的属性，属性名为语言名称，值为对应的语言文字
  例：
    定义：
      <Lang
        en="a. 233"
        zhT="贰叁叁"
      />
    则对于此Lang组件：
      this.en="a. 233";
      this.zhT="贰叁叁";

用法二拓展：
  函数fetchLang(data,key)将接受一个data(object)及key(string)，并将data内所有`{$key}_{$LANG_NAME}`属性取出，封装在一个对象后返回。
  例：
    定义：
      LANG_LIST=["en","zhT"];
      data={
        name_en:"a. 233"
        name_zhT:"贰叁叁",
        name_lala:"lala",
      };
      key="name";
    则：
      fetchLang(data,key)={
        en:"a. 233",
        zhT:"贰叁叁",
      }
    对应Lang组件：
      <Lang {...fetchLang(data,key)}/>
    则对于此Lang组件：
      this.en="a. 233";
      this.zhT="贰叁叁";

  此法常用语处理数据库内文字内容。

用法一适用于界面文字（静态）
用法二适用于动态文字、数据库内文字，例如商家名称

用法越靠后优先级最高，即若同时使用多个用法，且有重复定义语言，则以最靠后的用法的定义为准。
靠后指的是以上说明中的数字顺序，并非属性定义的先后顺序。
  例：
    定义：
      LANG_TEXT={
        "a. 233":{
          zhT:"贰叁叁",
          zhC:"二三三",
        },
      };
      <Lang
        id="a. 233"
        zhC="二三三2"
      />
    则对于此Lang组件：
      this.en="a. 233";
      this.zhT="贰叁叁";
      this.zhC="二三三2";

关于语言顺序：
  constants/lang.js中设置了LANG_LIST，里面存储所有可用语言
  其排列顺序将造成影响
  当组件找不到当前语言对应的文字时，会尝试显示之前语言的文字
  例：
    定义：
      LANG_LIST=["en","zhT","zhC"];
      state.lang.lang="zhC";
      <Lang
        en="a. 233"
        zhT="贰叁叁"
      />
    此时，此Lang组件中不存在zhC为文字，则组件会按LANG_LIST定义的顺序，显示zhT文字

  建议将DEFAULT_LANG始终放于第一位（即默认文字）

  Lang组件的其他属性：

    props.nodeNameDiv:true/false
      是否用display:"inline",margin:0的div标签代替span。
      需要的原因是有一些地方css规定了.span的属性，这样一来Lang组件的span标签就会被强行修改样式，比较尴尬。可以换成等价样式的div标签来避免。

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import withClass from 'decorators/withClass';
import _ from 'lodash';

import store from 'store';
import { actions as systemActions } from 'store/system';

const DEFAULT_LANG = 'en';
const LANG_LIST = ['en', 'zhC'];

// 将`${key}_${LANG_NAME}`封装为Object
export function getLangKey(key) {
  const ret = [];
  _.each(LANG_LIST, (name) => {
    ret.push(`${key}_${name}`);
  });
  return ret;
}

export function getLangById(dict, id, lang) {
  if (!dict[id]) return id;
  if (lang === LANG_LIST[0] && !dict[id][lang]) return id;
  let k = -1;
  _.each(LANG_LIST, (name, index) => {
    if (name === lang) {
      k = index;
      return false;
    }
  });
  if (k === -1) return id;
  for (let i = k; i >= 0; i -= 1) {
    const name = LANG_LIST[i];
    if (dict[id][name]) return dict[id][name];
  }
  for (let i = k + 1; i < LANG_LIST.length; i += 1) {
    const name = LANG_LIST[i];
    if (dict[id][name]) return dict[id][name];
  }
  return id;
}

// Get data[`${key}_${LANG_NAME}`]
export function getLangValue(data, key, lang) {
  if (data[`${key}_${lang}`]) return data[`${key}_${lang}`];
  let k = 0;
  for (k = 0; k < LANG_LIST.length; k += 1) {
    if (LANG_LIST[k] === lang) break;
  }
  for (let i = k; i >= 0; i -= 1) {
    const name = LANG_LIST[i];
    if (data[`${key}_${lang}`]) return data[`${key}_${lang}`];
  }
  for (let i = k; i < LANG_LIST.length; i += 1) {
    const name = LANG_LIST[i];
    if (data[`${key}_${lang}`]) return data[`${key}_${lang}`];
  }
  if (data[key]) return data[key];
  return '';
}

//
export function joinLang(data, key, symbol) {
  const ret = [];
  if (data[key]) ret.push(data[key]);
  _.each(LANG_LIST, (lang) => {
    if (data[`${key}_${lang}`]) ret.push(data[`${key}_${lang}`]);
  });
  return ret.join(symbol);
}

// 将data中的`${key}_${LANG_NAME}`取出并封装为Object
export function fetchLang(data, key) {
  const ret = {};
  if (data[key]) ret.id = data[key];
  _.each(LANG_LIST, (name) => {
    ret[name] = data[`${key}_${name}`];
  });
  return ret;
}

@withClass('Text')
@observer
export default class Text extends Component {

  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
    id: PropTypes.string,
    nodeNameDiv: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
  };

  static contextTypes = {
    dict: PropTypes.object,
  };

  countLang() {
    this.lang = store.system.lang;
    if (!this.lang) this.lang = DEFAULT_LANG;
    const def = DEFAULT_LANG;
    const dict = this.context.dict || {};
    // 用法一
    const id = typeof this.props.children === 'string' ? this.props.children : this.props.id;
    if (id) {
      for (let i = 0; i < LANG_LIST.length; i += 1) {
        const name = LANG_LIST[i];
        this[name] = '';
      }
      if (dict[id]) {
        if (dict[id][def]) {
          this[def] = dict[id][def];
        } else {
          this[def] = id;
        }
        for (let i = 1; i < LANG_LIST.length; i += 1) {
          const name = LANG_LIST[i];
          if (dict[id][name]) {
            this[name] = dict[id][name];
          } else {
            this[name] = this[LANG_LIST[i - 1]];
          }
        }
      } else {
        for (let i = 0; i < LANG_LIST.length; i += 1) {
          this[LANG_LIST[i]] = id;
        }
      }
    }
    // 用法二
    for (let i = 0; i < LANG_LIST.length; i += 1) {
      const name = LANG_LIST[i];
      if (this.props[name]) this[name] = this.props[name];
    }
    if (!this[def]) { // 如果不存在默认语言内容，则用优先度最高的语言内容替换之，若还是不行则设为空string
      this[def] = '';
      for (let i = 1; i < LANG_LIST.length; i += 1) {
        const name = LANG_LIST[i];
        if (this[name]) {
          this[def] = this[name];
          break;
        }
      }
    }
    // 将空语言内容用最相近的更高优先度的语言内容替代
    for (let i = 1; i < LANG_LIST.length; i += 1) {
      const name = LANG_LIST[i];
      if (!this[name]) this[name] = this[LANG_LIST[i - 1]];
    }
  }

  render() {
    const style = {
      ...this.style,
      ...(this.props.style || {}),
    };
    this.countLang();
    return (
      <span
        style={style}
        className={this.props.className}
        dangerouslySetInnerHTML={{
          __html: this[this.lang].replace(/ {2}/g, ' &nbsp;'),
        }}
      />
    );
  }
}
