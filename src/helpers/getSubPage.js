// root = '' or 'client' such kind
export default function getSubPage(path, root) {
  const nameArr = path.split('/');
  return nameArr[nameArr.indexOf(root) + 1];
}
