export const when = <T>(target: T) => {
  return {
    thenReturn: (toReturn: any) => (target as any).thenReturn(toReturn),
    thenCall: (toCall: Function) => (target as any).thenCall(toCall),
  };
};

export default <T>(target: T): T => {
  const stubs: { [key: string]: any } = {};

  let rootFn: Function;

  function when(target: any, path = '', overrideO?: any) {
    if (stubs[path]) {
      return stubs[path];
    }
    const stub: ProxyHandler<any> = new Proxy(target, {
      apply(target, _, argArray) {
        if (path === '' && rootFn) return rootFn(...argArray);
        return target(...argArray);
      },
      get: function(o, prop: string) {
        o = overrideO || o;
        if (target === o && prop === 'default') {
          return stub;
        }

        const stubIsFunction = typeof stubs[path] === 'function';
        if (prop === '_paths') {
          return Object.keys(stubs);
        } else if (prop === 'thenReturn') {
          return (res: any) => {
            stubs[path] = stubIsFunction ? () => res : res;
            if (path === '') rootFn = stubs[path];
          };
        } else if (prop === 'thenCall') {
          return (res: any) => {
            stubs[path] = stubIsFunction
              ? (...args: any[]) => res(...args)
              : res;
            if (path === '') rootFn = stubs[path];
          };
        }
        const val = o[prop];
        if (typeof val === 'function') {
          const subKey = `${path}-${prop}`;
          if (stubs[subKey]) {
            return stubs[subKey];
          }
          const fn = (...args: any[]) => {
            try {
              const res = val.apply(o, args);
              if (res) {
                if (res.catch) {
                  res.catch((e: Error) => {
                    console.log('Path failed', path, prop);
                    throw e;
                  });
                }
                return when(
                  res,
                  `${path}.${prop}(${args
                    .map(a => JSON.stringify(a))
                    .join(',')})`
                );
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
      },
    });
    stubs[path] = stub;
    return stub;
  }

  return when(target);
};
