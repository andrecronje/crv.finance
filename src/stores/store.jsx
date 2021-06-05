import config from '../config'
import async from 'async'
import memoize from 'memoizee'
import BigNumber from 'bignumber.js'
import { bnToFixed, multiplyBnToFixed, sumArray } from '../utils/numbers'

import {
  MAX_UINT256,
  ZERO_ADDRESS,

  SNACKBAR_ERROR,
  SNACKBAR_TRANSACTION_HASH,
  ERROR,

  CONFIGURE,
  CONFIGURE_RETURNED,
  GET_BALANCES,
  BALANCES_RETURNED,

  DEPOSIT,
  DEPOSIT_RETURNED,
  GET_DEPOSIT_AMOUNT,
  GET_DEPOSIT_AMOUNT_RETURNED,
  SLIPPAGE_INFO_RETURNED,

  WITHDRAW,
  WITHDRAW_RETURNED,
  GET_WITHDRAW_AMOUNT,
  GET_WITHDRAW_AMOUNT_RETURNED,

  SWAP,
  SWAP_RETURNED,
  GET_SWAP_AMOUNT,
  SWAP_AMOUNT_RETURNED,

  GET_ASSET_INFO,
  GET_ASSET_INFO_RETURNED,
  ADD_POOL,
  ADD_POOL_RETURNED
} from '../constants'
import Web3 from 'web3'

import {
  injected,
  walletconnect,
  walletlink,
  ledger,
  trezor,
  frame,
  fortmatic,
  portis,
  squarelink,
  torus,
  authereum
} from "./connectors"

const rp = require('request-promise')

const Dispatcher = require('flux').Dispatcher
const Emitter = require('events').EventEmitter

const dispatcher = new Dispatcher()
const emitter = new Emitter()

class Store {
  constructor() {

    this.store = {
      pools: [],
      basePools: [
        {
          id: 'USD',
          name: 'DAI/USDC/USDT Pool',
          erc20address: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
          balance: 0,
          decimals: 18,
          assets: [
            {
              index: 0,
              id: 'DAI',
              name: 'DAI',
              symbol: 'DAI',
              description: 'DAI',
              erc20address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              balance: 0,
              decimals: 18,
            },
            {
              index: 1,
              id: 'USDC',
              name: 'USD Coin',
              symbol: 'USDC',
              description: 'USD//C',
              erc20address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              balance: 0,
              decimals: 6,
            },
            {
              index: 2,
              id: 'USDT',
              name: 'USDT',
              symbol: 'USDT',
              description: 'USDT',
              erc20address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
              balance: 0,
              decimals: 6,
            },
          ]
        },
        {
          id: 'BTC',
          name: 'renBTC/wBTC/sBTC Pool',
          erc20address: '0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714',
          balance: 0,
          decimals: 18,
          assets: [
            {
              index: 0,
              id: 'renBTC',
              name: 'renBTC',
              symbol: 'renBTC',
              description: 'renBTC',
              erc20address: '0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D',
              balance: 0,
              decimals: 8,
            },
            {
              index: 1,
              id: 'WBTC',
              name: 'Wrapped BTC',
              symbol: 'WBTC',
              description: 'Wrapped BTC',
              erc20address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
              balance: 0,
              decimals: 8,
            },
            {
              id: 'sBTC',
              name: 'Synth sBTC',
              symbol: 'sBTC',
              description: 'Synth sBTC',
              erc20address: '0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6',
              balance: 0,
              decimals: 18,
            },
          ]
        }
      ],
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
        WalletConnect: walletconnect,
        WalletLink: walletlink,
        Ledger: ledger,
        Trezor: trezor,
        Frame: frame,
        Fortmatic: fortmatic,
        Portis: portis,
        Squarelink: squarelink,
        Torus: torus,
        Authereum: authereum
      },
      account: {},
      web3context: null
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE:
            this.configure(payload)
            break
          case GET_BALANCES:
            this.getBalances(payload)
            break
          case DEPOSIT:
            this.deposit(payload)
            break
          case WITHDRAW:
            this.withdraw(payload)
            break
          case SWAP:
            this.swap(payload)
            break
          case GET_SWAP_AMOUNT:
            this.getSwapAmount(payload)
            break
          case GET_ASSET_INFO:
            this.getAssetInfo(payload)
            break
          case ADD_POOL:
            this.addPool(payload)
            break
          case GET_DEPOSIT_AMOUNT:
            this.getDepositAmount(payload)
            break;
          case GET_WITHDRAW_AMOUNT:
            this.getWithdrawAmount(payload)
            break;
          default: {
          }
        }
      }.bind(this)
    )
  }

  getStore(index) {
    return(this.store[index])
  }

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return emitter.emit('StoreUpdated')
  }

  _checkApproval2 = async (asset, account, amount, contract) => {
    try {
      console.log(asset)
      const web3 = await this._getWeb3Provider()
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

      let ethAllowance = web3.utils.fromWei(allowance, "ether")
      if (asset.decimals !== 18) {
        ethAllowance = (allowance*10**asset.decimals).toFixed(0)
      }

      var amountToSend = MAX_UINT256

      if(parseFloat(ethAllowance) < parseFloat(amount)) {

        await erc20Contract.methods.approve(contract, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })

        return true
      } else {
        return true
      }

    } catch(error) {
      console.log(error)
      if(error.message) {
        return false
      }
      return false
    }
  }

  _checkApproval = async (asset, account, amount, contract, callback) => {
    try {
      const web3 = await this._getWeb3Provider()
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

      let ethAllowance = web3.utils.fromWei(allowance, "ether")
      if (asset.decimals !== 18) {
        ethAllowance = (allowance*10**asset.decimals).toFixed(0)
      }

      var amountToSend = MAX_UINT256

      if(parseFloat(ethAllowance) < parseFloat(amount)) {
        await erc20Contract.methods.approve(contract, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        callback()
      }

    } catch(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  configure = async () => {
    const account = store.getStore('account')

    if(!account || !account.address) {
      return false
    }

    const web3 = await this._getWeb3Provider()
    let poolsV1 = await this._getPools(web3)
    let poolsV2 = await this._getPoolsV2(web3)

    if(!poolsV2) {
      poolsV2 = []
    }
    if(!poolsV1) {
      poolsV1 = []
    }

    const pools = [...poolsV2, ...poolsV1]

    async.map(pools, (pool, callback) => {
      this._getPoolData(web3, pool, account, callback)
    }, (err, poolData) => {
      if(err) {
        emitter.emit(ERROR, err)
        return emitter.emit(SNACKBAR_ERROR, err)
      }

      store.setStore({ pools: poolData })
      return emitter.emit(CONFIGURE_RETURNED)
    })
  }

  _getPools = async (web3) => {
    try {
      const curveFactoryContract = new web3.eth.Contract(config.curveFactoryABI, config.curveFactoryAddress)

      const poolCount = await curveFactoryContract.methods.pool_count().call()

      const pools = await Promise.all([...Array(parseInt(poolCount)).keys()].map(
        i => curveFactoryContract.methods.pool_list(i).call()
      ))

      return pools.map((poolAddress) => {

        return {
          version: 1,
          address: poolAddress
        }
      })
    } catch (ex) {
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  _getPoolsV2 = async (web3) => {
    try {
      const curveFactoryContract = new web3.eth.Contract(config.curveFactoryV2ABI, config.curveFactoryV2Address)

      const poolCount = await curveFactoryContract.methods.pool_count().call()

      const pools = await Promise.all([...Array(parseInt(poolCount)).keys()].map(
        i => curveFactoryContract.methods.pool_list(i).call()
      ))

      return pools.map((poolAddress) => {
        return {
          version: 2,
          address: poolAddress
        }
      })
    } catch (ex) {
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  getBalances = async () => {
    const account = store.getStore('account')

    if(!account || !account.address) {
      return false
    }

    const web3 = await this._getWeb3Provider()

    return emitter.emit(BALANCES_RETURNED)
  }

  _getCoinData = memoize(async ({ web3, filteredCoins, coinAddress, accountAddress }) => {
    const erc20Contract0 = new web3.eth.Contract(config.erc20ABI, coinAddress)

    const symbol0 = await erc20Contract0.methods.symbol().call()
    const decimals0 = parseInt(await erc20Contract0.methods.decimals().call())
    const name0 = await erc20Contract0.methods.name().call()

    let balance0 = await erc20Contract0.methods.balanceOf(accountAddress).call()
    const bnDecimals0 = new BigNumber(10)
      .pow(decimals0)

    balance0 = new BigNumber(balance0)
      .dividedBy(bnDecimals0)
      .toFixed(decimals0, BigNumber.ROUND_DOWN)

    return {
      index: filteredCoins.indexOf(coinAddress),
      erc20address: coinAddress,
      symbol: symbol0,
      decimals: decimals0,
      name: name0,
      balance: balance0
    }
  }, {
    promise: true,
    normalizer: ([{ coinAddress, accountAddress }]) => `${coinAddress}-${accountAddress}`,
  })

  _getPoolData = async (web3, pool, account, callback) => {
    try {
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, pool.address)

      const symbol = await erc20Contract.methods.symbol().call()
      const decimals = parseInt(await erc20Contract.methods.decimals().call())
      const name = await erc20Contract.methods.name().call()

      let balance = await erc20Contract.methods.balanceOf(account.address).call()
      const bnDecimals = new BigNumber(10)
        .pow(decimals)

      balance = new BigNumber(balance)
        .dividedBy(bnDecimals)
        .toFixed(decimals, BigNumber.ROUND_DOWN)

      let curveFactoryContract = null
      if(pool.version === 1) {
        curveFactoryContract = new web3.eth.Contract(config.curveFactoryABI, config.curveFactoryAddress)
      } else {
        curveFactoryContract = new web3.eth.Contract(config.curveFactoryV2ABI, config.curveFactoryV2Address)
      }
      const poolBalances = await curveFactoryContract.methods.get_balances(pool.address).call()
      const isPoolSeeded = sumArray(poolBalances) !== 0

      let coins = await curveFactoryContract.methods.get_underlying_coins(pool.address).call()

      let filteredCoins = coins.filter((coin) => {
        return coin !== ZERO_ADDRESS
      })

      async.map(filteredCoins, async (coin, callbackInner) => {
        try {
          const returnCoin = await this._getCoinData({
            web3,
            filteredCoins,
            coinAddress: coin,
            accountAddress: account.address,
          });

          if(callbackInner) {
            callbackInner(null, returnCoin)
          } else {
            return returnCoin
          }
        } catch(ex) {
          console.log(ex)

          if(callbackInner) {
            callbackInner(ex)
          } else {
            throw ex
          }
        }

      }, (err, assets) => {
        if(err) {
          emitter.emit(ERROR, err)
          return emitter.emit(SNACKBAR_ERROR, err)
        }

        let liquidityAddress = ''
        let liquidityABI = ''

        const basePools = store.getStore('basePools')

        if(assets[1].erc20address.toLowerCase() === '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase()) {
          liquidityAddress = config.usdDepositerAddress
          liquidityABI = config.usdDepositerABI
        } else {
          liquidityAddress = config.btcDepositerAddress
          liquidityABI = config.btcDepositerABI
        }
        callback(null, {
          version: pool.version,
          address: pool.address,
          liquidityAddress: liquidityAddress,
          liquidityABI: liquidityABI,
          symbol: symbol,
          decimals: decimals,
          name: name,
          balance: balance.toString(),
          isPoolSeeded,
          id: `${symbol}-${pool.version}`,
          assets: assets
        })
      })
    } catch(ex) {
      console.log(ex)
      return callback(ex)
    }
  }

  deposit = async (payload) => {
    try {
      const { pool, amounts } = payload.content
      const account = store.getStore('account')
      const web3 = await this._getWeb3Provider()

      const approvals = await Promise.all(pool.assets.map(
        (asset, index) => { return this._checkApproval2(asset, account, amounts[index], pool.liquidityAddress) }
      ))

      console.log(approvals)

      const amountsBN = amounts.map((amount, index) => {

        let amountToSend = web3.utils.toWei(amount, "ether")
        if (pool.assets[index].decimals !== 18) {
          const decimals = new BigNumber(10)
            .pow(pool.assets[index].decimals)

          amountToSend = new BigNumber(amount)
            .times(decimals)
            .toFixed(0)
        }

        return amountToSend
      })

      console.log(amountsBN)

      this._callAddLiquidity(web3, account, pool, amountsBN, (err, a) => {
        if(err) {
          emitter.emit(ERROR, err)
          return emitter.emit(SNACKBAR_ERROR, err)
        }

        emitter.emit(DEPOSIT_RETURNED)
      })

    } catch (ex) {
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  _callAddLiquidity = async (web3, account, pool, amounts, callback) => {
    const metapoolContract = new web3.eth.Contract(pool.liquidityABI, pool.liquidityAddress)

    console.log(pool.liquidityAddress)
    let receive = '0'
    try {
      const amountToReceive = await metapoolContract.methods.calc_token_amount(pool.address, amounts, true).call()
      receive = new BigNumber(amountToReceive)
        .times(95)
        .dividedBy(100)
        .toFixed(0)
    } catch(ex) {
      console.log(ex)
      //if we can't calculate, we need to check the totalSupply
      // if 0, we just set receive to 0
      // if not 0, we throw an exception because it shouldn't be.
      const tokenContract = new web3.eth.Contract(config.erc20ABI, pool.address)
      const totalSupply = await tokenContract.methods.totalSupply().call()
      console.log(totalSupply)
      if(totalSupply == 0) {
        receive = '0'
      } else {
        return callback(ex)
      }
    }

    console.log(pool.address, amounts, receive)

    metapoolContract.methods.add_liquidity(pool.address, amounts, receive).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
    .on('transactionHash', function(hash){
      emitter.emit(SNACKBAR_TRANSACTION_HASH, hash)
      callback(null, hash)
    })
    .on('confirmation', function(confirmationNumber, receipt){
      if(confirmationNumber === 1) {
        dispatcher.dispatch({ type: CONFIGURE, content: {} })
      }
    })
    .on('receipt', function(receipt){
    })
    .on('error', function(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    })
  }

  withdraw = async (payload) => {
    try {
      const { pool, amount } = payload.content
      const account = store.getStore('account')
      const web3 = await this._getWeb3Provider()

      let amountToSend = web3.utils.toWei(amount, "ether")
      if (pool.decimals !== 18) {
        const decimals = new BigNumber(10)
          .pow(pool.decimals)

        amountToSend = new BigNumber(amount)
          .times(decimals)
          .toFixed(0)
      }

      console.log(pool);

      await this._checkApproval2({erc20address:pool.address, decimals:18}, account, amountToSend, pool.liquidityAddress)


      this._callRemoveLiquidity(web3, account, pool, amountToSend, (err, a) => {
        if(err) {
          emitter.emit(ERROR, err)
          return emitter.emit(SNACKBAR_ERROR, err)
        }

        emitter.emit(WITHDRAW_RETURNED)
      })


    } catch (ex) {
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  _callRemoveLiquidity = async (web3, account, pool, amountToSend, callback) => {
    const metapoolContract = new web3.eth.Contract(pool.liquidityABI, pool.liquidityAddress)

    //calcualte minimum amounts ?

    metapoolContract.methods.remove_liquidity(pool.address, amountToSend, [0, 0, 0, 0]).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
    .on('transactionHash', function(hash){
      emitter.emit(SNACKBAR_TRANSACTION_HASH, hash)
      callback(null, hash)
    })
    .on('confirmation', function(confirmationNumber, receipt){
      if(confirmationNumber === 1) {
        dispatcher.dispatch({ type: CONFIGURE, content: {} })
      }
    })
    .on('receipt', function(receipt){
    })
    .on('error', function(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    })
  }

  getSwapAmount = async (payload) => {
    try {
      const { pool, from, to, amount } = payload.content
      const account = store.getStore('account')
      const web3 = await this._getWeb3Provider()

      let amountToSend = web3.utils.toWei(amount, "ether")
      if (from.decimals !== 18) {
        const decimals = new BigNumber(10)
          .pow(from.decimals)

        amountToSend = new BigNumber(amount)
          .times(decimals)
          .toFixed(0)
      }

      const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.address)
      const amountToReceive = await metapoolContract.methods.get_dy_underlying(from.index, to.index, amountToSend).call()

      const receiveAmount = amountToReceive/10**to.decimals

      const returnObj = {
        sendAmount: amount,
        receiveAmount,
        receivePerSend: receiveAmount / amount,
        sendPerReceive: amount / receiveAmount,
      }

      emitter.emit(SWAP_AMOUNT_RETURNED, returnObj)
    } catch(ex) {
      console.log(ex)
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  swap = async (payload) => {
    try {
      const { from, to, pool, amount } = payload.content
      const account = store.getStore('account')
      const web3 = await this._getWeb3Provider()

      this._checkApproval(from, account, amount, pool.address, async (err) => {
        if(err) {
          emitter.emit(ERROR, err)
          return emitter.emit(SNACKBAR_ERROR, err)
        }

        let amountToSend = web3.utils.toWei(amount, "ether")
        if (from.decimals !== 18) {
          const decimals = new BigNumber(10)
            .pow(from.decimals)

          amountToSend = new BigNumber(amount)
            .times(decimals)
            .toFixed(0)
        }

        const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.address)
        const amountToReceive = await metapoolContract.methods.get_dy_underlying(from.index, to.index, amountToSend).call()

        this._callExchange(web3, account, from, to, pool, amountToSend, amountToReceive, (err, a) => {
          if(err) {
            emitter.emit(ERROR, err)
            return emitter.emit(SNACKBAR_ERROR, err)
          }

          emitter.emit(SWAP_RETURNED)
        })

      })
    } catch (ex) {
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  _callExchange = async (web3, account, from, to, pool, amountToSend, amountToReceive, callback) => {
    const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.address)

    const receive = new BigNumber(amountToReceive)
      .times(95)
      .dividedBy(100)
      .toFixed(0)

    metapoolContract.methods.exchange_underlying(from.index, to.index, amountToSend, receive).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
    .on('transactionHash', function(hash){
      emitter.emit(SNACKBAR_TRANSACTION_HASH, hash)
      callback(null, hash)
    })
    .on('confirmation', function(confirmationNumber, receipt){
      if(confirmationNumber === 1) {
        dispatcher.dispatch({ type: CONFIGURE, content: {} })
      }
    })
    .on('receipt', function(receipt){
    })
    .on('error', function(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    })
  }

  getAssetInfo = async (payload) => {
    try {
      const { address } = payload.content
      const account = store.getStore('account')
      const web3 = await this._getWeb3Provider()

      const erc20Contract = new web3.eth.Contract(config.erc20ABI, address)

      const symbol = await erc20Contract.methods.symbol().call()
      const decimals = parseInt(await erc20Contract.methods.decimals().call())
      const name = await erc20Contract.methods.name().call()

      let balance = await erc20Contract.methods.balanceOf(account.address).call()
      const bnDecimals = new BigNumber(10)
        .pow(decimals)

      balance = new BigNumber(balance)
        .dividedBy(bnDecimals)
        .toFixed(decimals, BigNumber.ROUND_DOWN)

      const returnObj = {
        address: address,
        symbol: symbol,
        decimals: decimals,
        name: name,
        balance: balance
      }

      emitter.emit(GET_ASSET_INFO_RETURNED, returnObj)
    } catch(ex) {
      console.log(ex)
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  addPool = async (payload) => {
    try {
      const { basePool, address,  name, symbol, a, fee } = payload.content
      const account = store.getStore('account')
      const web3 = await this._getWeb3Provider()

      this._callDeployMetapool(web3, account, basePool, address, name, symbol, a, fee, (err, a) => {
        if(err) {
          emitter.emit(ERROR, err)
          return emitter.emit(SNACKBAR_ERROR, err)
        }

        emitter.emit(ADD_POOL_RETURNED)
      })

    } catch (ex) {
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  _callDeployMetapool = async (web3, account, basePool, address, name, symbol, a, fee, callback) => {
    const curveFactoryContract = new web3.eth.Contract(config.curveFactoryV2ABI, config.curveFactoryV2Address)

    curveFactoryContract.methods.deploy_metapool(basePool.erc20address, name, symbol, address, '10', '4000000').send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
    .on('transactionHash', function(hash){
      emitter.emit(SNACKBAR_TRANSACTION_HASH, hash)
      callback(null, hash)
    })
    .on('confirmation', function(confirmationNumber, receipt){
      if(confirmationNumber === 1) {
        dispatcher.dispatch({ type: CONFIGURE, content: {} })
      }
    })
    .on('receipt', function(receipt){
    })
    .on('error', function(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    })
  }

  getDepositAmount = async (payload) => {
    try {
      const { pool, amounts } = payload.content
      const web3 = await this._getWeb3Provider()

      const amountsBN = amounts.map((amount, index) => {
        let amountToSend = web3.utils.toWei(amount, "ether")
        if (pool.assets[index].decimals !== 18) {
          const decimals = new BigNumber(10)
            .pow(pool.assets[index].decimals)

          amountToSend = new BigNumber(amount)
            .times(decimals)
            .toFixed(0)
        }

        return amountToSend
      })

      const zapContract = new web3.eth.Contract(pool.liquidityABI, pool.liquidityAddress)
      const poolContract = new web3.eth.Contract(config.metapoolABI, pool.address)

      const [receiveAmountBn, virtPriceBn] = await Promise.all([
        zapContract.methods.calc_token_amount(pool.address, amountsBN, true).call(),
        poolContract.methods.get_virtual_price().call(),
      ])

      const receiveAmount = bnToFixed(receiveAmountBn, 18)
      let slippage;

      if (Number(receiveAmount)) {
        const virtualValue = multiplyBnToFixed(virtPriceBn, receiveAmountBn, 18)
        const realValue = sumArray(amounts) // Assuming each component is at peg

        slippage = (virtualValue / realValue) - 1;
      }

      emitter.emit(GET_DEPOSIT_AMOUNT_RETURNED, parseFloat(receiveAmount))
      emitter.emit(SLIPPAGE_INFO_RETURNED, {
        slippagePcent: typeof slippage !== 'undefined' ? slippage * 100 : slippage,
      })
    } catch(ex) {
      console.log(ex)
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  _getGasPrice = async () => {
    try {
      const web3 = await this._getWeb3Provider();
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceInGwei = web3.utils.fromWei(gasPrice, "gwei");
      return gasPriceInGwei;
    } catch (e) {
      console.log(e);
      return store.getStore("universalGasPrice");
    }
  };

  _getWeb3Provider = async () => {
    const web3context = store.getStore('web3context')

    if(!web3context) {
      return null
    }
    const provider = web3context.library.provider
    if(!provider) {
      return null
    }

    const web3 = new Web3(provider)

    return web3
  }
}

var store = new Store()

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
}
