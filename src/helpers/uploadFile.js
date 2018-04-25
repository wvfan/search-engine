import * as F from 'firebase';

const STO = F.storage();

export default function uploadFile(params) {
  const {
    file,
    storageRef,
  } = params;
  return new Promise((resolve, reject) => {
    if (!file) reject('Require file');
    if (!storageRef) reject('Require storageRef');

    STO.ref().child(storageRef).put(file)
    .then(() => {
      resolve();
    });
  })
  .then(() => STO.ref().child(storageRef).getDownloadURL());
}
