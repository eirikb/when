module.exports = function (target) {
  const stubs = {};

  function when(target, path = '', overrideO) {
    if (stubs[path]) {
      return stubs[path];
    }
    const stub = new Proxy(target, {
      get: function (o, prop) {
        o = overrideO || o;
        if (target === o && prop === 'default') {
          return stub;
        }
        if (prop === '_paths') {
          return Object.keys(stubs);
        }
        const val = o[prop];
        if (typeof val === 'function') {
          const subKey = `${path}-${prop}`;
          if (stubs[subKey]) {
            return stubs[subKey];
          }
          const fn = (...args) => {
            if (fn.thenReturnArgs) {
              return fn.thenReturnArgs;
            }
            if (fn.thenCallFn) {
              fn.thenCallFn(...args);
            }
            try {
              const res = val.apply(o, args);
              if (res) {
                if (res.catch) {
                  res.catch(e => {
                    console.log('Path failed', path, prop);
                    throw e;
                  });
                }
                return when(res, `${path} ${prop}(${args.map(a => JSON.stringify(a)).join(',')})`);
              }
            } catch (e) {
              console.log('Path failed:', path, prop);
              throw e;
            }
          };
          val.thenReturn = args => {
            fn.thenReturnArgs = args;
            stubs[subKey] = fn;
          };
          val.thenCall = fn => {
            fn.thenCallFn = fn;
            stubs[subKey] = fn;
          };
          return when(fn, `${path} ${prop}`, val);
        }
        if (typeof val === 'object') {
          return when(o[prop], `${path} ${prop}`);
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
