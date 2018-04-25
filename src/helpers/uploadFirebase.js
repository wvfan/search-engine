import * as F from 'firebase';

const DB = F.database();
const STO = F.storage();

export default function uploadFirebase(file, props) {
  const name = new Date().toJSON() + file.name;
  const storageRef = `${props.storageRef || 'public/images/'}${name}`;
  const ref = STO.ref().child(storageRef);
  ref.put(file).then(() => (
    ref.getDownloadURL()
  )).then((url) => {
    DB.ref(`${props.path}`).set({
      __type: 'File',
      metaData: {
        owner: 'unknown',
        size: file.size,
      },
      name,
      storageRef,
      url,
    });
  });
}
