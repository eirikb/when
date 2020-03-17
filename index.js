module.exports = function (target) {
  const stubs = {};

  let rootFn;

  function when(target, path = '', overrideO) {
    if (stubs[path]) {
      return stubs[path];
    }
    const stub = new Proxy(target, {
      apply(target, thisArg, argArray) {
        if (path === '' && rootFn) return rootFn(...argArray);
        return target(...argArray);
      },
      get: function (o, prop) {
        o = overrideO || o;
        if (target === o && prop === 'default') {
          return stub;
        }

        const stubIsFunction = typeof stubs[path] === 'function';
        if (prop === '_paths') {
          return Object.keys(stubs);
        } else if (prop === 'thenReturn') {
          return res => {
            stubs[path] = stubIsFunction ? () => res : res;
            if (path === '') rootFn = stubs[path];
          }
        } else if (prop === 'thenCall') {
          return res => {
            stubs[path] = stubIsFunction ? (...args) => res(...args) : res;
            if (path === '') rootFn = stubs[path];
          }
        }
        const val = o[prop];
        if (typeof val === 'function') {
          const subKey = `${path}-${prop}`;
          if (stubs[subKey]) {
            return stubs[subKey];
          }
          const fn = (...args) => {
            try {
              const res = val.apply(o, args);
              if (res) {
                if (res.catch) {
                  res.catch(e => {
                    console.log('Path failed', path, prop);
                    throw e;
                  });
                }
                return when(res, `${path}.${prop}(${args.map(a => JSON.stringify(a)).join(',')})`);
              }
            } catch (e) {
              console.log('Path failed:', path, prop);
              throw e;
            }
          };
          return when(fn, `${path}.${prop}`, val);
        }
        if (typeof val === 'object') {
          return when(o[prop], `${path}.${prop}`);
        } else {
          return val;
        }
      }
    });
    stubs[path] = stub;
    return stub;
  }

  return when(target);
};
