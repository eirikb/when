import anyTest, { TestInterface } from 'ava';
import initWhen, { when } from '../src';

interface Hello {
  hello: {
    world(
      input?: number
    ): {
      yes: {
        no: Function;
      };
    };
  };
}

const test = anyTest as TestInterface<{ objectToStub: Hello }>;

test.beforeEach(t => {
  t.context.objectToStub = {
    hello: {
      world() {
        return {
          yes: {
            no() {
              throw Error('Please');
            },
          },
        };
      },
    },
  } as Hello;
});

test('Example', t => {
  const greet = {
    hello() {
      console.log('hello called');
      return {
        world() {
          console.log('world called');
          return 'Hello, world!';
        },
      };
    },
  };

  const stub = initWhen(greet);
  // Print "hello called"
  when(stub.hello().world).thenReturn('Oh no!');

  // Print "hello called"
  t.is('Oh no!', stub.hello().world());

  when(stub.hello).thenCall(() => {
    console.log('Called');
    t.pass();
  });

  // Print "called"
  stub.hello();
});

test('Simple stub', t => {
  const { objectToStub } = t.context;
  const stub = initWhen(objectToStub);
  when(stub.hello.world).thenReturn(1);
  t.deepEqual(1, stub.hello.world() as any);
});

test('Stub chain ', t => {
  const { objectToStub } = t.context;
  const stub = initWhen(objectToStub);
  when(stub.hello.world().yes.no).thenReturn(1);
  t.deepEqual(1, stub.hello.world().yes.no());
});

test('Stub by different arguments', t => {
  const { objectToStub } = t.context;
  const stub = initWhen(objectToStub);
  when(stub.hello.world(1).yes.no).thenReturn(1);
  when(stub.hello.world(2).yes.no).thenReturn(2);
  t.deepEqual(1, stub.hello.world(1).yes.no());
  t.deepEqual(2, stub.hello.world(2).yes.no());
  t.deepEqual(1, stub.hello.world(1).yes.no());
});

test('Rewiremock and default - should resolve to stub', t => {
  const { objectToStub } = t.context;
  const stub = initWhen(objectToStub);
  t.is(stub, (stub as any).default);
});

test('Rewiremock default only on top level', t => {
  const { objectToStub } = t.context;
  const stub = initWhen(objectToStub);
  t.not(stub, (stub.hello as any).default);
});

test('Mock any property', t => {
  const { objectToStub } = t.context;
  const stub = initWhen(objectToStub);
  when(stub.hello).thenReturn(1);
  t.deepEqual(1, stub.hello as any);
});

test('Stub function at root thenReturn', t => {
  const fn = () => 1;
  const stub = initWhen(fn);
  when(stub).thenReturn(2);
  t.is(2, stub());
});

test('Stub function at root thenCall', t => {
  const fn = () => 1;
  const stub = initWhen(fn);
  t.plan(1);
  when(stub).thenCall(() => t.pass());
  stub();
});

test('Leave function at root if not overridden', t => {
  const fn = () => 1;
  const stub = initWhen(fn);
  t.is(1, stub());
});
