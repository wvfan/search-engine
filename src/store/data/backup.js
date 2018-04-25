import F from 'firebase';
import _ from 'lodash';

import temps from 'temps';
import backup from '~/data.json';

const db = F.firestore();

const OFFLINE = false;
if (OFFLINE) {
  class Query {

    constructor(params) {
      this.$coll = params.coll;
      this.$where = params.where;
      this.$orderBy = params.orderBy;
      this.$startAt = params.startAt;
      this.$endAt = params.endAt;
    }

    doc(id) {
      return {
        onSnapshot: (callback) => {
          setTimeout(() => {
            callback({
              id,
              data: () => backup[this.$coll][id],
            });
          }, 10);
        },
      };
    }

    onSnapshot(callback) {
      setTimeout(() => {
        const data = [];
        _.each(backup[this.$coll], (doc, id) => {
          const where = [...this.$where];
          if (this.$startAt) where.push([this.$orderBy[0], '>=', this.$startAt]);
          if (this.$endAt) where.push([this.$orderBy[0], '<=', this.$endAt]);
          let wValid = true;
          _.each(where, (item) => {
            const [key, type, value] = item;
            if (typeof doc[key] !== 'undefined' && doc[key] !== null && value === null
              || typeof doc[key] === 'number' && typeof value !== 'number'
              || typeof doc[key] === 'number' && type === '==' && doc[key] !== value
              || typeof doc[key] === 'number' && type === '<=' && doc[key] > value
              || typeof doc[key] === 'number' && type === '>=' && doc[key] < value
              || typeof doc[key] === 'string' && typeof value !== 'string'
              || typeof doc[key] === 'string' && type === '==' && doc[key] !== value
              || typeof doc[key] === 'string' && type === '<=' && doc[key].localeCompare(value) > 0
              || typeof doc[key] === 'string' && type === '>=' && doc[key].localeCompare(value) < 0
            ) {
              wValid = false;
              return false;
            }
          });
          if (!wValid) return;
          data.push({
            id,
            data: () => doc,
          });
        });
        if (this.$orderBy) {
          data.sort((A, B) => {
            const key = this.$orderBy[0];
            A = A[key];
            B = B[key];
            if (this.$orderBy[1] === 'asc') {
              if (typeof A === 'undefined' || A === null) return -1;
              if (typeof B === 'undefined' || B === null) return 1;
              if (typeof A === 'number') return A - B;
              if (typeof A === 'string') return A.localeCompare(B);
            } else {
              if (typeof A === 'undefined' || A === null) return 1;
              if (typeof B === 'undefined' || B === null) return -1;
              if (typeof A === 'number') return B - A;
              if (typeof A === 'string') return B.localeCompare(A);
            }
            return 0;
          });
        }
        callback(data);
      }, 10);
    }

    where(key, type, value) {
      return new Query({
        coll: this.$coll,
        where: [
          ...this.$where,
          [key, type, value],
        ],
        orderBy: this.$orderBy,
        startAt: this.$startAt,
        endAt: this.$endAt,
      });
    }

    orderBy(key, type = 'asc') {
      return new Query({
        coll: this.$coll,
        where: this.$where,
        orderBy: [key, type],
        startAt: this.$startAt,
        endAt: this.$endAt,
      });
    }

    startAt(value) {
      return new Query({
        coll: this.$coll,
        where: this.$where,
        orderBy: this.$orderBy,
        startAt: value,
        endAt: this.$endAt,
      });
    }

    endAt(value) {
      return new Query({
        coll: this.$coll,
        where: this.$where,
        orderBy: this.$orderBy,
        startAt: this.$endAt,
        endAt: value,
      });
    }

    off() {

    }
  }

  db.collection = (coll) => {
    return new Query({
      coll,
      where: [],
    });
  };
}
