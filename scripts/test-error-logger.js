#!/usr/bin/env node
import { errorLogger } from '../src/utils/errorLogger.js';

// Object with throwing Symbol.toPrimitive
const weird = {
  name: 'weird',
  toString() { throw new Error('toString exploded'); },
  valueOf() { throw new Error('valueOf exploded'); },
  [Symbol.toPrimitive]() { throw new Error('toPrimitive exploded'); }
};

try {
  console.log('Testing errorLogger with weird object...');
  errorLogger.log(new Error('Test error'), { foo: weird, bar: { a: 1 } });
  console.log('No crash: PASS');
  process.exit(0);
} catch (err) {
  console.error('errorLogger crashed:', err);
  process.exit(1);
}
