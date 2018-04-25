
export default function getSearchs(searchStr) {
  if (searchStr.charAt(0) === '?') searchStr = searchStr.slice(1);
  const searchsArr = searchStr.split('&');
  const searchs = {};
  searchsArr.forEach((search) => {
    const arr = search.split('=');
    searchs[arr[0]] = arr[1];
  });
  return searchs;
}
