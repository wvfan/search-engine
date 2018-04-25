export default function limitStringLength(str, length, suffix) {
  if (str.length > length) {
    return `${str.substr(0, length)}${suffix}`;
  }
  return str;
}
