import * as F from 'firebase';
import _ from 'lodash';

const db = F.database();
const refs = {};
const DB = {};

const cacheTime = 60000; // Leave one minute for recalling

const getQuery = (path, query) => {
  let ref = db.ref(path);
  if (query.$orderByKey) ref = ref.orderByKey();
  if (typeof query.$has !== 'undefined') ref = ref.orderByChild(Object.keys(query.$has)[0]).equalTo(query.$has[Object.keys(query.$has)[0]]);
  if (typeof query.$limitToLast !== 'undefined') ref = ref.limitToLast(query.$limitToLast);
  if (typeof query.$limitToFirst !== 'undefined') ref = ref.limitToFirst(query.$limitToFirst);
  return ref;
};

const getQueryStr = (path, query) => {
  let ref = `${path}?`;
  if (query.$orderByKey) ref += 'orderByKey&';
  if (typeof query.$has !== 'undefined') ref += `has:${Object.keys(query.$has)[0]}=${query.$has[Object.keys(query.$has)[0]]}`;
  if (typeof query.$limitToLast !== 'undefined') ref += `limitToLast=${query.$limitToLast}&`;
  if (typeof query.$limitToFirst !== 'undefined') ref += `limitToFirst=${query.$limitToFirst}&`;
  return ref;
};

DB.listenRef = (path, query, callback, callbackErr, type = 'value') => {
  const label = getQueryStr(path, query);
  if (!refs[label]) { // new path
    refs[label] = {
      ref: getQuery(path, query),
    };
  }
  if (!refs[label][type]) { // new type
    refs[label][type] = {
      data: undefined,
      err: undefined,
      lastOff: undefined,
      callbacks: [],
      callbackErrs: [],
    };
    refs[label].ref.on(type, (snapshot) => { // Open a listener
      setTimeout(() => {
        const data = snapshot.val();
        refs[label][type].data = data;
        refs[label][type].callbacks.forEach((callback) => {
          callback(_.cloneDeep(data)); // Prevent data changing
        });
      }, 0);
    }, (err) => {
      setTimeout(() => {
        refs[label][type].err = err;
        refs[label][type].callbackErrs.forEach((callbackErr) => {
          callbackErr(_.cloneDeep(err)); // Prevent data changing
        });
      }, 0);
    });
  } else {
    setTimeout(() => {
      if (typeof refs[label][type].data !== 'undefined') { // Already have data fetched.
        callback(_.cloneDeep(refs[label][type].data));
      } else if (typeof refs[label][type].err !== 'undefined') { // Already have err.
        callbackErr(_.cloneDeep(refs[label][type].err));
      }
    }, 0);
  }
  refs[label][type].callbacks.push(callback);
  refs[label][type].callbackErrs.push(callbackErr);

  const ret = {
    wOff: false,
    off: () => {
      if (ret.wOff) {
        throw new Error('The listener is already off');
      }
      const callbacks = refs[label][type].callbacks;
      const callbackErrs = refs[label][type].callbackErrs;
      const index = callbacks.indexOf(callback);
      if (index === -1) {
        throw new Error('No such callback');
      }
      refs[label][type].callbacks = [...callbacks.slice(0, index), ...callbacks.slice(index + 1, callbacks.length)];
      refs[label][type].callbackErrs = [...callbackErrs.slice(0, index), ...callbackErrs.slice(index + 1, callbackErrs.length)];
      ret.wOff = true;
      if (!refs[label][type].callbacks.length) { // All callback disappear, off the ref
        refs[label][type].lastOff = new Date().getTime();
        const lastOffC = refs[label][type].lastOff;
        setTimeout(() => {
          if (refs[label][type].callbacks.length) return; // Have recall
          if (lastOffC !== refs[label][type].lastOff) return; // The off was put off
          refs[label].ref.off(type);
          // delete refs[label][type];
          delete refs[label];
        }, cacheTime);
      }
    },
  };
  return ret;
};

const reservedKeys = ['$redirect', '$all', '$forEachKey', '$nullKeys', '$orderByKey', '$has', '$limitToLast', '$limitToFirst', '$startAt'];

const checkSchema = (schema) => {
  if (schema.$forEachKey) {
    _.map(schema, (child, key) => {
      if (reservedKeys.indexOf(key) !== -1) return;
      console.warn('Should not have other keys when using $forEachKey');
    });
  }
  _.map(schema, (child, key) => {
    if (reservedKeys.indexOf(key) !== -1) return;
    checkSchema(child);
  });
};

DB.listen = (schema, callback) => {
  checkSchema(schema);

  const data = {}; // All data

  const checkReady = (node) => {
    node = node || root;
    if (!node.wReady) return false;
    let wReady = true;
    _.each(node.children, (child) => {
      if (!checkReady(child)) {
        wReady = false;
        return false;
      }
    });
    if (node !== root) return wReady;
    if (wReady) { // All ready
      callback(_.cloneDeep(data.$root));
      return true;
    }
  };

  const buildSchema = (node, schema, key, path, data, value) => {
    if (!node) {
      node = {
        ref: null,
        children: {},
        wReady: false,
        off: () => {
          if (node.ref) node.ref.off();
          _.map(node.children, (child, key) => {
            child.off();
          });
          delete node.ref;
          delete node.children;
        },
        clear: () => {
          _.map(node.children, (child, key) => {
            child.off();
          });
          node.children = {};
          node.wReady = false;
        },
      };
    }

    if (schema.$redirect && schema.$redirect.indexOf('${') === -1) { // Simple redirect
      eval(`path = \`${schema.$redirect}\`;`);
      value = undefined;
    }
    if (typeof value !== 'undefined') { // Data given by parent all fetched by self
      node.wReady = true;
      if (schema.$redirect && schema.$redirect.indexOf('${') !== -1) { // Use value to redirect
        eval(`path = \`${schema.$redirect}\`;`);
        node.children.$redirectWithValue = buildSchema(null, {
          ...schema,
          $redirect: undefined,
        }, key, path, data, undefined);
      } else if (schema === true) {
        data[key] = value;
      } else if (typeof schema === 'object') {
        data[key] = {};
        if (schema.$all) data[key] = value;
        if (schema.$forEachKey) {
          _.map(value, (child, schemaKey) => {
            node.children[schemaKey] = buildSchema(null, schema.$forEachKey, schemaKey, path ? `${path}/${schemaKey}` : schemaKey, data[key], child);
          });
        }
        _.map(schema, (child, schemaKey) => {
          if (reservedKeys.indexOf(schemaKey) !== -1) return;
          if (!data[key]) data[key] = {};
          node.children[schemaKey] = buildSchema(null, child, schemaKey, path ? `${path}/${schemaKey}` : schemaKey, data[key], value ? value[schemaKey] : null);
        });
      }
    } else if (schema.$redirect && schema.$redirect.indexOf('${') !== -1) { // Need value to redirect
      node.ref = DB.listenRef(path, schema, (dataN) => {
        buildSchema(node, schema, key, path, data, dataN);
      }, (err) => {
        data[key] = null;
        node.wReady = true;
        checkReady();
      });
    } else if (schema.$forEachKey) { // Operate with keys
      if (schema.$nullKeys === true) { // Have fetched __keys but get null, need to fetch all
        node.ref = DB.listenRef(path, schema, (dataN) => {
          node.clear();
          if (dataN) {
            const schemaN = {
              ...schema,
              $forEachKey: false,
            };
            _.map(dataN, (child, schemaKey) => {
              schemaN[schemaKey] = schema.$forEachKey;
            });
            node.children.$fetchWithKeys = buildSchema(null, schemaN, key, path, data, dataN);
          } else {
            data[key] = null;
          }
          node.wReady = true;
          checkReady();
        }, (err) => {
          data[key] = null;
          node.wReady = true;
          checkReady();
        });
      } else { // Try to fetch __keys
        node.ref = DB.listenRef(`${path}/__keys`, {}, (keys) => {
          node.clear();
          if (keys === null) {
            node.children.$fetchAll = buildSchema(null, {
              ...schema,
              $nullKeys: true,
            }, key, path, data, undefined);
          } else {
            const schemaN = {
              ...schema,
              $forEachKey: false,
            };
            _.map(keys, (schemaKey) => {
              schemaN[schemaKey] = schema.$forEachKey;
            });
            node.children.$fetchWithKeys = buildSchema(null, schemaN, key, path, data, undefined);
          }
          node.wReady = true;
          checkReady();
        }, (err) => {
          data[key] = null;
          node.wReady = true;
          checkReady();
        });
      }
    } else if (schema === true || schema.$all) { // Need to fetch data
      node.ref = DB.listenRef(path, schema, (dataN) => {
        buildSchema(node, schema.$all ? { ...schema, $redirect: undefined } : true, key, path, data, dataN);
        checkReady();
      }, (err) => {
        data[key] = null;
        node.wReady = true;
        checkReady();
      });
    } else { // Normal object data, no need to fetch
      data[key] = {};
      node.wReady = true;
      _.map(schema, (child, schemaKey) => {
        if (reservedKeys.indexOf(schemaKey) !== -1) return;
        node.children[schemaKey] = buildSchema(null, child, schemaKey, path ? `${path}/${schemaKey}` : schemaKey, data[key], undefined);
      });
    }

    return node;
  };

  const root = buildSchema(null, schema, '$root', '', data, undefined);
  return root;
};

DB.fetch = schema => (
  new Promise((resolve, reject) => {
    checkSchema(schema);

    const data = {}; // All data

    const checkReady = (node) => {
      node = node || root;
      if (!node.wReady) return false;
      let wReady = true;
      _.each(node.children, (child) => {
        if (!checkReady(child)) {
          wReady = false;
          return false;
        }
      });
      if (node !== root) return wReady;
      if (wReady) { // All ready
        resolve(_.cloneDeep(data.$root));
        return true;
      }
    };

    const buildSchema = (node, schema, key, path, data, value) => {
      if (!node) {
        node = {
          children: {},
          wReady: false,
        };
      }

      if (schema.$redirect && schema.$redirect.indexOf('${') === -1) { // Simple redirect
        eval(`path = \`${schema.$redirect}\`;`);
        value = undefined;
      }
      if (typeof value !== 'undefined') { // Data given by parent all fetched by self
        node.wReady = true;
        if (value === null) {
          data[key] = value;
        } else if (schema.$redirect && schema.$redirect.indexOf('${') !== -1) { // Use value to redirect
          eval(`path = \`${schema.$redirect}\`;`);
          node.children.$redirectWithValue = buildSchema(null, {
            ...schema,
            $redirect: undefined,
          }, key, path, data, undefined);
        } else if (schema === true) {
          data[key] = value;
        } else if (typeof schema === 'object') {
          data[key] = {};
          if (schema.$all) data[key] = value;
          if (schema.$forEachKey) {
            _.map(value, (child, schemaKey) => {
              node.children[schemaKey] = buildSchema(null, schema.$forEachKey, schemaKey, path ? `${path}/${schemaKey}` : schemaKey, data[key], child);
            });
          }
          _.map(schema, (child, schemaKey) => {
            if (reservedKeys.indexOf(schemaKey) !== -1) return;
            node.children[schemaKey] = buildSchema(null, child, schemaKey, path ? `${path}/${schemaKey}` : schemaKey, data[key], value[schemaKey]);
          });
        }
      } else if (schema.$redirect && schema.$redirect.indexOf('${') !== -1) { // Need value to redirect
        getQuery(path, schema).once('value').then((snapshot) => {
          const dataN = snapshot.val();
          buildSchema(node, schema, key, path, data, dataN);
        }).catch((err) => {
          data[key] = null;
          node.wReady = true;
          checkReady();
        });
      } else if (schema.$forEachKey) { // Operate with keys
        if (schema.$nullKeys === true) { // Have fetched __keys but get null, need to fetch all
          getQuery(path, schema).once('value').then((snapshot) => {
            const dataN = snapshot.val();
            if (dataN) {
              const schemaN = {
                ...schema,
                $forEachKey: false,
              };
              _.map(dataN, (child, schemaKey) => {
                schemaN[schemaKey] = schema.$forEachKey;
              });
              node.children.$fetchWithKeys = buildSchema(null, schemaN, key, path, data, dataN);
            }
            node.wReady = true;
            checkReady();
          }).catch((err) => {
            data[key] = null;
            node.wReady = true;
            checkReady();
          });
        } else { // Try to fetch __keys
          getQuery(`${path}/__keys`, schema).once('value').then((snapshot) => {
            const keys = snapshot.val();
            if (keys === null) {
              node.children.$fetchAll = buildSchema(null, {
                ...schema,
                $nullKeys: true,
              }, key, path, data, undefined);
            } else {
              const schemaN = {
                ...schema,
                $forEachKey: false,
              };
              _.map(keys, (schemaKey) => {
                schemaN[schemaKey] = schema.$forEachKey;
              });
              node.children.$fetchWithKeys = buildSchema(null, schemaN, key, path, data, undefined);
            }
            node.wReady = true;
            checkReady();
          }).catch((err) => {
            data[key] = null;
            node.wReady = true;
            checkReady();
          });
        }
      } else if (schema === true || schema.$all) { // Need to fetch data
        getQuery(path, schema).once('value').then((snapshot) => {
          const dataN = snapshot.val();
          buildSchema(node, schema.$all ? { ...schema, $redirect: undefined } : true, key, path, data, dataN);
          checkReady();
        }).catch((err) => {
          buildSchema(node, {}, key, path, data, null);
          checkReady();
        });
      } else { // Normal object data, no need to fetch
        data[key] = {};
        node.wReady = true;
        _.map(schema, (child, schemaKey) => {
          if (reservedKeys.indexOf(schemaKey) !== -1) return;
          node.children[schemaKey] = buildSchema(null, child, schemaKey, path ? `${path}/${schemaKey}` : schemaKey, data[key], undefined);
        });
      }

      return node;
    };

    const root = buildSchema(null, schema, '$root', '', data, undefined);
  })
);

DB.arrToObj = (arr, key = 'objectId') => {
  if (!(arr instanceof Array)) throw new Error('Need an array');
  const ret = {};
  _.map(arr, (item, index) => {
    if (key === '$key') {
      ret[index] = item;
    } else {
      if (!item[key]) return;
      ret[item[key]] = item;
    }
  });
  return ret;
};

DB.objToArr = (obj, wStrict) => {
  if (typeof obj === 'undefined') return [];
  if (typeof obj !== 'object') throw new Error('Need an object');
  const ret = [];
  _.each(obj, (item, index) => {
    index = Number(`${index}`, 10);
    if (isNaN(index)) {
      if (wStrict) {
        throw new Error('The index must be int');
      } else {
        ret.push(item);
      }
    } else {
      ret[index] = item;
    }
  });
  return ret;
};

DB.objChangeKey = (obj, key) => {
  if (typeof obj === 'undefined') return {};
  if (typeof obj !== 'object') throw new Error('Need an object');
  if (!key) throw new Error('Need a key');
  const ret = {};
  _.each(obj, (item) => {
    ret[item[key]] = item;
  });
  return ret;
};

export default DB;
