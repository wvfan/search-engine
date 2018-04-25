import * as mobx from 'mobx';
import _ from 'lodash';

import temps from 'temps';
import Cache from './cache';

const schema = {};
const onSchemaUpdates = new Set();
const onSchemaUpdate = (func) => {
  onSchemaUpdates.add(func);
  if (temps.data.schema) func();
};
const removeSchemaUpdate = (func) => {
  onSchemaUpdates.delete(func);
};
db.collection('schema').onSnapshot((docs) => {
  docs.forEach((doc) => {
    schema[doc.id] = doc.data();
  });
  temps.data.schema = schema;
  onSchemaUpdates.forEach((func) => {
    func();
  });
});

const cache = new Cache();

class ListenNode {
  constructor({
    schema, key, onUpdateData, onUpdateReady,
  }) {
    this.wReady = false;
    this.schema = { ...schema };
    this.key = key;
    this.onUpdateData = onUpdateData;
    this.onUpdateReady = onUpdateReady;
    this.onChildUpdateData = ::this.onChildUpdateData;
    this.onChildUpdateDataL = ::this.onChildUpdateDataL;
    this.onChildUpdateReady = ::this.onChildUpdateReady;
    this.listen = ::this.listen;
    this.onReceiveData = ::this.onReceiveData;
    this.dataO = {};
    this.data = {};
    this.nodes = {
      $self: {},
    };
    this.listen();
  }

  listen() {
    const {
      schema, onUpdateData, onUpdateReady, dataO,
    } = this;
    let { key } = this;
    if (typeof key === 'string' && key.startsWith('_')) key = key.substr(1);

    let wListen = false;
    _.each(schema, (item, key) => {
      if (typeof key === 'string' && key.startsWith('$')) {
        wListen = true;
        return false;
      }
    });
    if (!wListen) {
      _.each(schema, (item, key) => {
        this.nodes[key] = new ListenNode({
          schema: item,
          key,
          onUpdateData: this.onChildUpdateData(key),
          onUpdateReady: this.onChildUpdateReady,
        });
      });
      return;
    }

    const schemaA = temps.data.schema;
    const wDoc = !!schema.$id;
    if ((schema.$where || schema.$orderBy || schema.$forEach) && wDoc) {
      throw new Error('Cannot use $id and $where/$orderBy/$forEach together');
    }
    if (!schema.$coll) { // Confirm collection
      if (!schemaA[key] && !wDoc
        || !schemaA[`${key}s`] && wDoc) {
        throw new Error(`Cannot find collection according to key '${key}'. Please specify.`);
      }
      if (wDoc) {
        schema.$coll = `${key}s`;
      } else {
        schema.$coll = key;
      }
    }

    this.listener = cache.listen(schema, this.onReceiveData);
  }

  onReceiveData(data) {
    const {
      schema, key, dataO, nodes,
    } = this;

    const wDoc = !!schema.$id;
    this.data = data;

    this.wReady = true;
    if (wDoc) {
      _.each(schema, (item, key) => {
        if (key.startsWith('$')) return;
        if (typeof item === 'function') {
          if (dataO && data && _.isEqual(data[key], dataO[key])) return;
          if (data[key] === null) {
            if (nodes.$self[key]) nodes.$self[key].off();
            delete nodes.$self[key];
            return;
          }
          this.wReady = false;
          if (nodes.$self[key]) nodes.$self[key].off();
          delete nodes.$self[key];
          nodes.$self[key] = new ListenNode({
            schema: item(data[key]),
            key,
            onUpdateData: this.onChildUpdateData(key),
            onUpdateReady: this.onChildUpdateReady,
          });
        }
      });
      _.each(nodes.$self, (node, key) => {
        if (!data || typeof data !== 'object' || data[key] === undefined || data[key] === null) {
          node.off();
          delete nodes.$self[key];
        }
      });
    } else if (schema.$forEach) {
      _.each(data, (item, key) => {
        if (typeof schema.$forEach === 'function') {
          if (dataO && _.isEqual(item)) return;
          this.wReady = false;
          if (nodes[key]) nodes[key].off();
          delete nodes[key];
          nodes[key] = new ListenNode({
            schema: schema.$forEach(item, data),
            key,
            onUpdateData: this.onChildUpdateData(key),
            onUpdateReady: this.onChildUpdateReady,
          });
        } else {
          _.each(schema.$forEach, (itemL, keyL) => {
            if (data[key] && dataO[key] && _.isEqual(data[key][keyL], dataO[key][keyL])) return;
            if (!data[key] || data[key][keyL] === null) {
              if (nodes[key] && nodes[key][keyL]) nodes[key][keyL].off();
              delete nodes[key][keyL];
              return;
            }
            this.wReady = false;
            if (!nodes[key]) nodes[key] = {};
            if (nodes[key][keyL]) nodes[key][keyL].off();
            delete nodes[key][keyL];
            nodes[key][keyL] = new ListenNode({
              schema: itemL(data[key][keyL], item),
              key: keyL,
              onUpdateData: this.onChildUpdateDataL(key, keyL),
              onUpdateReady: this.onChildUpdateReady,
            });
          });
        }
      });
      _.each(nodes, (node, key) => {
        if (key === '$self') return;
        if (data[key] === undefined || data[key] === null) {
          if (node instanceof ListenNode) {
            node.off();
            delete nodes[key];
          } else {
            _.each(node, (nodeL, key) => {
              nodeL.off();
              delete node[key];
            });
          }
        } else {
          if (node instanceof ListenNode) return;
          _.each(node, (nodeL, keyL) => {
            if (data[key][keyL] === undefined || data[key][keyL] === null) {
              nodeL.off();
              delete node[keyL];
            }
          });
        }
      });
    }
    this.dataO = _.cloneDeep(data);
    if (this.wReady) this.onUpdateData(this.data);
    this.onUpdateReady();
  }

  onChildUpdateData(key) {
    return (data) => {
      if (!key.startsWith('_')) this.data[key] = data;
    };
  }

  onChildUpdateDataL(key, keyL) {
    return (data) => {
      if (!key.startsWith('_')) this.data[key][keyL] = data;
    };
  }

  onChildUpdateReady() {
    this.wReady = true;
    _.each(this.nodes, (node) => {
      if (node instanceof ListenNode) {
        if (!node.wReady) {
          this.wReady = false;
          return false;
        }
      } else {
        _.each(node, (node) => {
          if (!node.wReady) {
            this.wReady = false;
            return false;
          }
        });
        if (!this.wReady) return false;
      }
    });
    if (this.wReady) this.onUpdateData(this.data);
    this.onUpdateReady();
  }

  updateStore(state) {
    const {
      schema, key, dataO, nodes,
    } = this;

    if (schema.$coll && !state.colls.get(schema.$coll)) {
      state.colls.set(schema.$coll, mobx.observable.map());
    }

    const wDoc = !!schema.$id;
    if (wDoc) {
      state.colls.get(schema.$coll).set(schema.$id, _.cloneDeep(this.dataO));
    } else {
      _.each(this.dataO, (data, key) => {
        state.colls.get(schema.$coll).set(key, _.cloneDeep(data));
      });
    }

    _.each(nodes, (node) => {
      if (node instanceof ListenNode) {
        node.updateStore(state);
      } else {
        _.each(node, (nodeL) => {
          nodeL.updateStore(state);
        });
      }
    });
  }

  off() {
    _.each(this.nodes, (node) => {
      if (node instanceof ListenNode) {
        node.off();
      } else {
        _.each(node, (node) => {
          node.off();
        });
      }
    });
    delete this.nodes;
    if (this.listener) this.listener.off();
    delete this.listener;
  }
}

const compareValue = (A, operator, B) => {
  if (operator === '==') return _.isEqual(A, B);
  if (A === undefined || A === null) return false;
  if (typeof A !== typeof B) return false;
  if (typeof A === 'number') {
    switch (operator) {
      case '<': return A < B;
      case '<=': return A <= B;
      case '>': return A > B;
      case '>=': return A >= B;
      default: return false;
    }
  }
  if (typeof A === 'string') {
    switch (operator) {
      case '<': return A.localeCompare(B) < 0;
      case '<=': return A.localeCompare(B) <= 0;
      case '>': return A.localeCompare(B) > 0;
      case '>=': return A.localeCompare(B) >= 0;
      default: return false;
    }
  }
  return false;
};

const catchNode = (schema, key, state) => {
  const data = {};

  if (typeof key === 'string' && key.startsWith('_')) key = key.substr(1);

  let wListen = false;
  _.each(schema, (item, key) => {
    if (typeof key === 'string' && key.startsWith('$')) {
      wListen = true;
      return false;
    }
  });
  if (!wListen) {
    _.each(schema, (item, key) => {
      data[key] = catchNode(item, key, state);
    });
    return data;
  }

  const schemaA = temps.data.schema;
  const wDoc = !!schema.$id;
  if ((schema.$where || schema.$orderBy || schema.$forEach) && wDoc) {
    throw new Error('Cannot use $id and $where/$orderBy/$forEach together');
  }
  if (!schema.$coll) { // Confirm collection
    if (!schemaA[key] && !wDoc
      || !schemaA[`${key}s`] && wDoc) {
      throw new Error(`Cannot find collection according to key '${key}'. Please specify.`);
    }
    if (wDoc) {
      schema.$coll = `${key}s`;
    } else {
      schema.$coll = key;
    }
  }

  const coll = schema.$coll;

  if (wDoc) {
    _.merge(data, mobx.toJS(state.colls.get(coll) && state.colls.get(coll).get(schema.$id) || {}));
    _.each(schema, (item, key) => {
      if (key.startsWith('$')) return;
      if (typeof item === 'function') {
        data[key] = catchNode(item(data[key]), key, state);
      } else {
        data[key] = catchNode(item, key, state);
      }
    });
    return data;
  }

  _.each(schema.$where, (item, key) => {
    if (typeof item === 'object') {
      if (!(item instanceof Array)) {
        throw new Error('Please use Array to specify a range');
      }
      if (item.length !== 2 && item.length !== 4) {
        throw new Error('The length of an array range must be 2 or 4');
      }
    }
  });

  if (!state.colls.get(coll)) return {};
  let dataArr = [];
  state.colls.get(coll).forEach((dataL, id) => {
    let wValid = true;
    _.each(schema.$where, (item, key) => {
      const operators = ['=='];
      const values = [item];
      if (typeof item === 'object') {
        if (item.length === 2) {
          if (['>', '<', '>=', '<=', '=='].indexOf(item[0]) === -1) {
            operators[0] = '>=';
            operators[1] = '<=';
            [values[0], values[1]] = item;
          } else {
            [operators[0], values[1]] = item;
          }
        } else {
          [operators[0], values[0], operators[1], values[1]] = item;
        }
      }
      for (let i = 0; i < operators.length; i += 1) {
        const operator = operators[i];
        const value = values[i];
        if (!compareValue(dataL[key], operator, value)) {
          wValid = false;
          return false;
        }
      }
    });
    _.each(schema.$orderBy, (orderBy, key) => {
      const operators = [];
      const values = [];
      if (orderBy.$startAt !== undefined) {
        operators.push('>=');
        values.push(orderBy.$startAt);
      }
      if (orderBy.$endAt !== undefined) {
        operators.push('<=');
        values.push(orderBy.$endAt);
      }
      if (orderBy.$startAfter !== undefined) {
        operators.push('>');
        values.push(orderBy.$startAfter);
      }
      if (orderBy.$endBefore !== undefined) {
        operators.push('<');
        values.push(orderBy.$endBefore);
      }
      for (let i = 0; i < operators.length; i += 1) {
        const operator = operators[i];
        const value = values[i];
        if (!compareValue(dataL[key], operator, value)) {
          wValid = false;
          return false;
        }
      }
    });
    if (wValid) dataArr.push(mobx.toJS(dataL));
  });
  if (schema.$orderBy) {
    _.each(schema.$orderBy, (orderBy, key) => {
      const operator = orderBy.$order === 'desc' ? '<=' : '>=';
      let dataArrC = [];
      _.each(dataArr, (data) => {
        let i = 0;
        for (; i < dataArrC.length; i += 1) {
          if (!compareValue(data[key], dataArrC[i][key])) break;
        }
        dataArrC = [...dataArrC.slice(0, i), data, ...dataArrC.slice(i)];
      });
      dataArr = dataArrC;
      if (orderBy.$offset !== undefined) {
        dataArr = dataArr.slice(orderBy.$offset);
      }
      if (orderBy.$limit !== undefined) {
        dataArr = dataArr.slice(0, orderBy.$limit);
      }
    });
  }
  _.each(dataArr, (dataL) => {
    if (typeof schema.$forEach === 'function') {
      data[dataL.objectId] = catchNode(schema.$forEach(dataL), dataL.objectId, state);
    } else {
      data[dataL.objectId] = dataL;
    }
  });
  if (typeof schema.$forEach === 'object') {
    _.each(data, (dataL, id) => {
      _.each(schema.$forEach, (item, key) => {
        if (typeof item === 'function') {
          dataL[key] = catchNode(item(dataL[key], dataL), key, state);
        } else {
          dataL[key] = catchNode(item, key, state);
        }
      });
    });
  }
  return data;
};

export const initialState = {
  colls: mobx.observable.map({}),
};

export const actions = {

  listen: (schema, callback) => {
    return (state) => {
      const ret = {
        node: null,
      };
      const main = () => {
        ret.node = new ListenNode({
          schema,
          onUpdateData: (data) => {
            mobx.transaction(() => {
              ret.node.updateStore(state);
            });
            if (callback) callback(data);
          },
          onUpdateReady: () => {},
        });
      };
      onSchemaUpdate(main);
      ret.off = () => {
        if (ret.node) ret.node.off();
        removeSchemaUpdate(main);
      };
      return ret;
    };
  },

  catch: (schema, callback) => {
    return (state) => {
      return mobx.autorun(() => {
        callback(catchNode(schema, '', state));
      });
    };
  },
};
