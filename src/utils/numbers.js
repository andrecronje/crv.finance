import BigNumber from 'bignumber.js'

const bnToFixed = (bn, decimals, displayDecimals = decimals) => {
  const bnDecimals = new BigNumber(10).pow(decimals)

  return new BigNumber(bn)
    .dividedBy(bnDecimals)
    .toFixed(displayDecimals, BigNumber.ROUND_DOWN)
};

const floatToFixed = (float, decimals = 0) => (
  new BigNumber(float).toFixed(decimals, BigNumber.ROUND_DOWN)
);

// multiplyBnToFixed(bigNumber1, bigNumber2[, bigNumberN], decimals)
const multiplyBnToFixed = (...args) => {
  if (args.length < 3) throw new Error('multiplyBnToFixed needs at least 3 arguments: first bn, second bn to multiply with first, and number of decimals.')

  const decimals = args[args.length - 1]
  const bigNumbers = args.slice(0, -1)

  return bnToFixed(multiplyArray(bigNumbers), decimals * bigNumbers.length, decimals)
};

const multiplyArray = (numbers) => numbers.reduce((total, n) => total * n, 1)
const sumArray = (numbers) => numbers.reduce((total, n) => total + Number(n), 0)
const sumArrayBn = (bigNumbers) => BigNumber.sum.apply(null, bigNumbers)

export {
  bnToFixed,
  multiplyBnToFixed,
  multiplyArray,
  sumArray,
  sumArrayBn,
  floatToFixed,
}
