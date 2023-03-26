import {getErrorMessage} from './get-error-message.js';
import {expect, test} from '@jest/globals';

test(`getErrorMessage()`, () => {
  expect(getErrorMessage(new Error(`foo`))).toBe(`foo`);
  expect(getErrorMessage(`foo`)).toBe(`foo`);
  expect(getErrorMessage(undefined)).toBe(`unknown error`);
  expect(getErrorMessage(null)).toBe(`unknown error`);
  expect(getErrorMessage({})).toBe(`unknown error`);
  expect(getErrorMessage(42)).toBe(`unknown error`);
});
