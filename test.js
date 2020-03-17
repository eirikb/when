const test = require('ava');
const when = require('./index');

test.beforeEach(t => {
  t.context.objectToStub = {
    hello: {
      world() {
        return {
          yes: {
            no() {
              throw Error('Please');
            }
          }
        }
      }
    }
  };
});

test('Simple stub', t => {
  const { objectToStub } = t.context;
  const stub = when(objectToStub);
  stub.hello.world.thenReturn(1);
  t.deepEqual(1, stub.hello.world());
});

test('Stub chain ', t => {
  const { objectToStub } = t.context;
  const stub = when(objectToStub);
  stub.hello.world().yes.no.thenReturn(1);
  t.deepEqual(1, stub.hello.world().yes.no());
});

test('Stub by different arguments', t => {
  const { objectToStub } = t.context;
  const stub = when(objectToStub);
  stub.hello.world(1).yes.no.thenReturn(1);
  stub.hello.world(2).yes.no.thenReturn(2);
  t.deepEqual(1, stub.hello.world(1).yes.no());
  t.deepEqual(2, stub.hello.world(2).yes.no());
  t.deepEqual(1, stub.hello.world(1).yes.no());
});

test('Rewiremock and default - should resolve to stub', t => {
  const { objectToStub } = t.context;
  const stub = when(objectToStub);
  t.is(stub, stub.default);
});

test('Rewiremock default only on top level', t => {
  const { objectToStub } = t.context;
  const stub = when(objectToStub);
  t.not(stub, stub.hello.default);
});

test('Mock any property', t => {
  const { objectToStub } = t.context;
  const stub = when(objectToStub);
  stub.hello.thenReturn(1);
  t.deepEqual(1, stub.hello);
});

test('Stub function at root thenReturn', t => {
  const fn = () => 1;
  const stub = when(fn);
  stub.thenReturn(2);
  t.is(2, stub());
});

test('Stub function at root thenCall', t => {
  const fn = () => 1;
  const stub = when(fn);
  t.plan(1);
  stub.thenCall(() => t.pass());
  stub();
});

test('Leave function at root if not overridden', t => {
  const fn = () => 1;
  const stub = when(fn);
  t.is(1, stub());
});
