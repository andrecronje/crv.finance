import {
  floatToFixed,
} from './numbers';

it('floatToFixed()', () => {
  expect(floatToFixed(1.23456)).toEqual('1');
  expect(floatToFixed(1.23456, 1)).toEqual('1.2');
  expect(floatToFixed(1.23456, 2)).toEqual('1.23');
  expect(floatToFixed(1.23456, 4)).toEqual('1.2345');
  expect(floatToFixed(12)).toEqual('12');
  expect(floatToFixed(12, 2)).toEqual('12.00');
  expect(floatToFixed(12.00)).toEqual('12');
  expect(floatToFixed(0.0000000000005, 5)).toEqual('0.00000');
});
