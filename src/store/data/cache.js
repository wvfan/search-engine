import _ from 'lodash';

import temps from 'temps';

const db = mongoose.connection;
db.on('error', (err) => {
  console.log(err);
});
db.once('open', (err, client) => {
  console.log(err, client);
});

class CacheNode {

  constructor({
    wDoc, coll, id, callback,
  }) {
    this.coll = coll;
    this.id = id;
    this.callbacks = new Set();
    this.querys = new Set();
    this.callback = ::this.callback;
    if (wDoc) {
      this.callbacks.add(callback);
      this.listener = db.collection(coll).doc(id).onSnapshot(this.callback);
    } else {
      this.querys.add(callback);
    }
  }

  callback(snapshot) {
    const data = snapshot.data();
    if (data) data.objectId = snapshot.id;
    if (_.isEqual(data, this.data)) return;
    this.data = data;
    this.callbacks.forEach((callback) => {
      callback(_.cloneDeep(this.data));
    });
  }

  addDoc(callback) {
    this.callbacks.add(callback);
    if (this.data !== undefined) callback(_.cloneDeep(this.data));
  }

  removeDoc(callback) {
    this.callbacks.delete(callback);
    if (!this.callbacks.size) {
      this.listener();
      delete this.listener;
    }
  }

  addQuery(callback) {
    this.querys.add(callback);
    if (this.listener) {
      this.listener();
      delete this.listener;
    }
  }

  removeQuery(callback) {
    this.querys.delete(callback);
    if (!this.querys.size) {
      if (!this.callbacks.size) return;
      this.listener = db.collection(this.coll).doc(this.id).onSnapshot(this.callback);
    }
  }

  getData(data) {
    if (_.isEqual(data, this.data)) return;
    this.data = data;
    this.callbacks.forEach((callback) => {
      callback(_.cloneDeep(this.data));
    });
  }
}

export default class Cache {

  constructor() {
    this.colls = {};
    this.listen = ::this.listen;
  }

  listen(schema, callback) {
    const wDoc = !!schema.$id;
    const coll = schema.$coll;
    const id = schema.$id;

    if (!this.colls[coll]) this.colls[coll] = {};

    let query = db.collection(coll);

    _.each(schema.$where, (item, key) => {
      if (typeof item === 'object') {
        if (!(item instanceof Array)) {
          throw new Error('Please use Array to specify a range');
        }
        if (item.length !== 2 && item.length !== 4) {
          throw new Error('The length of an array range must be 2 or 4');
        }
        if (item.length === 2) {
          if (['>', '<', '>=', '<=', '=='].indexOf(item[0]) === -1) {
            query = query.where(key, '>=', item[0]).where(key, '<=', item[1]);
          } else {
            query = query.where(key, item[0], item[1]);
          }
        } else {
          query = query.where(key, item[0], item[1]).where(key, item[2], item[3]);
        }
      } else {
        query = query.where(key, '==', item);
      }
    });
    _.each(schema.$orderBy, (orderBy, key) => {
      if (orderBy.$order) {
        query = query.orderBy(key, orderBy.$order);
      } else {
        query = query.orderBy(key);
      }
      if (orderBy.$startAt !== undefined) {
        query = query.startAt(orderBy.$startAt);
      }
      if (orderBy.$endAt !== undefined) {
        query = query.endAt(orderBy.$endAt);
      }
      if (orderBy.$startAfter !== undefined) {
        query = query.startAfter(orderBy.$startAfter);
      }
      if (orderBy.$endBefore !== undefined) {
        query = query.endBefore(orderBy.$endBefore);
      }
      if (orderBy.$limit !== undefined) {
        query = query.limit(orderBy.$limit);
      }
    });

    if (wDoc) {
      if (!this.colls[coll][id]) {
        this.colls[coll][id] = new CacheNode({
          wDoc,
          coll,
          id,
          callback,
        });
      } else {
        this.colls[coll][id].addDoc(callback);
      }
      return {
        off: () => {
          this.colls[coll][id].removeDoc(callback);
          if (!this.colls[coll][id].callbacks.size
            && !this.colls[coll][id].querys.size) {
            delete this.colls[coll][id];
          }
        },
      };
    } else {
      const ids = new Set();
      const callbackC = (snapshots) => {
        snapshots.forEach((snapshot) => {
          ids.delete(snapshot.id);
        });
        ids.forEach((id) => {
          this.colls[coll][id].removeQuery(callback);
          if (!this.colls[coll][id].callbacks.size
            && !this.colls[coll][id].querys.size) {
            delete this.colls[coll][id];
          }
        });
        const data = {};
        snapshots.forEach((snapshot) => {
          ids.add(snapshot.id);
          if (!this.colls[coll][snapshot.id]) {
            this.colls[coll][snapshot.id] = new CacheNode({
              wDoc,
              callback,
            });
          } else {
            this.colls[coll][snapshot.id].addQuery(callback);
          }
          data[snapshot.id] = snapshot.data();
          if (data[snapshot.id]) data[snapshot.id].objectId = snapshot.id;
        });
        callback(data);
      };
      const listener = query.onSnapshot(callbackC);
      return {
        off: () => {
          listener();
          ids.forEach((id) => {
            this.colls[coll][id].removeQuery(callback);
            if (!this.colls[coll][id].callbacks.size
              && !this.colls[coll][id].querys.size) {
              delete this.colls[coll][id];
            }
          });
        },
      };
    }
  }
}
