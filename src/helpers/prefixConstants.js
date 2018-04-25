// automatically add prefix to constant strings

export default function prefixConstants(prefix, keys) {
  return keys.reduce((prefixed, key) => {
    prefixed[key] = `${prefix}_${key}`;
    return prefixed;
  }, Object.create(null));
}
