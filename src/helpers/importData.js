import * as F from 'firebase';

const DB = F.database();
const STO = F.storage();

/*
importData({
  data: .json file,
  className: the className in firebase database, such as 'merchants',
});
*/

function getFile(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      resolve(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  });
}

function defaultProcessor(data) {
  let promise = new Promise((resolve, reject) => {
    resolve(data);
  });
  promise = promise.then((data) => {
    data.forEach((item) => {
      delete item.ACL;
      item.createdAt = new Date(item.createdAt);
      item.updatedAt = new Date(item.updatedAt);
    });
    return data;
  }).then((data) => {
    const promiseN = new Promise((resolve, reject) => {
      let fileNum = 0;
      let fileC = 0;
      data.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (typeof item[key] === 'object' && item[key] && item[key].__type === 'File') {
            fileNum += 1;
            getFile(item[key].url).then((file) => {
              const ref = STO.ref().child(`public/images/${item[key].key}`);
              return ref.put(file);
            }).then(() => {
              const ref = STO.ref().child(`public/images/${item[key].key}`);
              return ref.getDownloadURL();
            }).then((url) => {
              console.log(`${fileC + 1}/${fileNum}`);
              item[key].url = url;
              item[key].storageRef = `public/images/${item[key].key}`;
              item[key].createdAt = new Date(item[key].createdAt);
              item[key].updatedAt = new Date(item[key].updatedAt);
              delete item[key].provider;
              delete item[key].objectId;
              delete item[key].bucket;
              delete item[key].key;
              fileC += 1;
              if (fileC >= fileNum) {
                resolve(data);
              }
            });
          }
          if (typeof item[key] === 'object' && item[key] && item[key].__type === 'Pointer') {
            item[key] = item[key].objectId;
          }
        });
      });
    });
    return promiseN;
  });

  return promise;
}

export default function importData(props) {
  const { data, dataProcessor, className } = props;
  let processor = defaultProcessor;
  if (typeof dataProcessor === 'function') {
    processor = dataProcessor;
  }
  processor(data).then((data) => {
    console.log(data);
    data.forEach((item) => {
      const id = item.objectId;
      DB.ref(`${className}/${id}`).set(item);
    });
  });
}
