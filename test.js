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

