# When

[![Version](https://img.shields.io/npm/v/@eirikb/when.svg)](https://www.npmjs.com/package/@eirikb/when)

Stubbing library for chained SDKs. 
  * Pass in a real object.
  * Every function call gets a new stub, mapped by arguments.
  * Last function can either `thenReturn` or `thenCall`.
  
I needed some way to test [pnpjs](https://github.com/pnp/pnpjs), and this library in combination with [ava](https://github.com/ava/ava) and [rewiremock](https://github.com/theKashey/rewiremock) works great.  

## Install

```bash
npm i @eirikb/when
```

## Example Azure Function-ish setup

index.js
```js
const { sp } = require('@pnp/sp-commonjs');

module.exports = async () => {
  const spItem = sp.web.getList('web/Lists/A').items.getById(137);
  const item = await spItem.get();

  await spItem.update({
    Sum: item.Sum + 100
  });
}
```

test.js
```js
const test = require('ava');
const rewiremock = require('rewiremock/node');
const { sp } = require('@pnp/sp-commonjs');
const when = require('@eirikb/when');

const spStub = when(sp);
rewiremock('@pnp/sp-commonjs').with(({ sp: spStub }));
rewiremock.enable();

test('Sum', async t => {
  t.plan(1);
  const spItem = sp.web.getList('web/Lists/A').items.getById(137);
  spItem.get.thenReturn({ Sum: 600 });
  spItem.update.thenCall(item => {
    t.deepEqual({ Sum: 700 }, item);
  });

  await require('./index')();
});
