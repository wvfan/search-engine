import { observable, transaction, autorun, toJS } from 'mobx';
import ls from 'localStorage';
import _ from 'lodash';

import defUpdate from 'helpers/defUpdate';

import * as system from './system';
import * as pages from './pages';
import * as user from './user';
// import * as data from './data';

const items = {
  system,
  pages,
  user,
  // data,
};

class Store {

  constructor() {
    _.each(items, (item, name) => {
      const {
        initialState,
        serialize = obj => obj,
        deserialize = obj => obj,
      } = item;
      let obj = initialState || {};
      if (ls.getItem(name)) {
        obj = {
          ...obj,
          ..._.pick(deserialize(JSON.parse(ls.getItem(name))), Object.keys(obj)),
        };
      }
      this[name] = observable(obj);
      autorun(() => {
        const obj = serialize(toJS(this[name]));
        ls.setItem(name, JSON.stringify(obj));
      });
      const funcsN = {};
      if (!item.actions.update) {
        item.actions.update = defUpdate;
      }
      _.each(item.actions, (func, key) => {
        if (typeof func !== 'function') return;
        if (func.wModified) return;
        const funcName = _.lowerCase(key).split(' ').join('_').toUpperCase();
        funcsN[key] = (...args) => {
          return new Promise((resolve, reject) => {
            console.log(`action ${name.toUpperCase()}_${funcName} ${new Date().toJSON()}`);
            let ret;
            transaction(async () => {
              const realFunc = func(...args);
              try {
                resolve(await realFunc({
                  state: this[name],
                }));
              } catch (err) {
                reject(err);
              }
            });
          });
        };
        funcsN[key].wModified = true;
      });
      _.each(funcsN, (func, key) => {
        item.actions[key] = func;
      });
    });
  }
}

const store = new Store();
export default store;
