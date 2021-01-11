import config from "../config";
import async from 'async';
import BigNumber from 'bignumber.js'

import {
  MAX_UINT256,
  SNACKBAR_ERROR,
  SNACKBAR_TRANSACTION_HASH,
  ERROR,

  CONFIGURE,
  CONFIGURE_RETURNED,
  GET_BALANCES,
  BALANCES_RETURNED,

  DEPOSIT,
  DEPOSIT_RETURNED,
  WITHDRAW,
  WITHDRAW_RETURNED,

  SWAP,
  SWAP_RETURNED,
  GET_SWAP_AMOUNT,
  SWAP_AMOUNT_RETURNED,
} from '../constants';
import Web3 from 'web3';

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
} from "./connectors";

const rp = require('request-promise');

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    this.store = {
      pools: [
        {
          id: "musd3CRV",
          name: 'Curve.fi MUSD/3Crv',
          symbol: 'musd3CRV',
          lpTokenAddress: '0x1AEf73d49Dedc4b1778d0706583995958Dc862e6',
          liquidityAddress: '0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6',
          balance: 0,
          decimals: 18,
          assets: []
        }
      ],
      assets: [],
      configAssets: [
        {
          id: 'USDT',
          name: 'USDT',
          symbol: 'USDT',
          description: 'USDT',
          erc20address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          balance: 0,
          decimals: 6,
        },
        {
          id: 'USDC',
          name: 'USD Coin',
          symbol: 'USDC',
          description: 'USD//C',
          erc20address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          balance: 0,
          decimals: 6,
        },
        {
          id: 'DAI',
          name: 'DAI',
          symbol: 'DAI',
          description: 'DAI',
          erc20address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          balance: 0,
          decimals: 18,
        },
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
            this.configure(payload);
            break;
          case GET_BALANCES:
            this.getBalances(payload);
            break
          case DEPOSIT:
            this.deposit(payload);
            break
          case WITHDRAW:
            this.withdraw(payload);
            break
          case SWAP:
            this.swap(payload)
            break
          case GET_SWAP_AMOUNT:
            this.getSwapAmount(payload)
            break
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return emitter.emit('StoreUpdated');
  };

  _checkApproval = async (asset, account, amount, contract, callback) => {
    if(asset.erc20address === 'Ethereum') {
      return callback()
    }

    try {
      const web3 = await this._getWeb3Provider()
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

      let ethAllowance = web3.utils.fromWei(allowance, "ether")
      if (asset.decimals !== 18) {
        ethAllowance = (allowance*10**asset.decimals).toFixed(0);
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

  _checkApprovalWaitForConfirmation = async (asset, account, amount, contract, callback) => {
    try {
      const web3 = await this._getWeb3Provider()
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

      const ethAllowance = web3.utils.fromWei(allowance, "ether")

      if(parseFloat(ethAllowance) < parseFloat(amount)) {
        erc20Contract.methods.approve(contract, web3.utils.toWei(amount, "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
          .on('transactionHash', function(hash){
            callback()
          })
          .on('error', function(error) {
            if (!error.toString().includes("-32601")) {
              if(error.message) {
                return callback(error.message)
              }
              callback(error)
            }
          })
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

    const web3 = await this._getWeb3Provider();

    const pools = this._getPools();

    async.map(pools, (pool, callback) => {

      this._getPoolData(web3, pool, account, (err, data) => {
        if(err) {
          return callback(err)
        }

        pool.balance = data.balance
        pool.symbol = data.symbol
        pool.decimals = data.decimals
        pool.name = data.name
        pool.id = data.symbol
        pool.assets = data.assets

        callback(null, pool)
      })
    }, (err, poolData) => {
      if(err) {
        emitter.emit(ERROR, err);
        return emitter.emit(SNACKBAR_ERROR, err)
      }

      store.setStore({ pools: poolData })
      return emitter.emit(CONFIGURE_RETURNED)
    })
  }

  _getPools = () => {
    //change this to use the pool factory created by Andre
    return store.getStore('pools')
  }

  getBalances = async () => {
    const account = store.getStore('account')
    const assets = store.getStore('assets')

    if(!account || !account.address) {
      return false
    }

    const web3 = await this._getWeb3Provider();

    return emitter.emit(BALANCES_RETURNED)
  }

  _getPoolData = async (web3, pool, account, callback) => {
    try {
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, pool.lpTokenAddress)
      const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.liquidityAddress)


      //POOL
      const symbol = await erc20Contract.methods.symbol().call();
      const decimals = await erc20Contract.methods.decimals().call();
      const name = await erc20Contract.methods.name().call();

      let balance = await erc20Contract.methods.balanceOf(account.address).call();
      balance = parseFloat(balance)/10**decimals


      const coin0 = await metapoolContract.methods.coins(0).call()
      const coin1 = await metapoolContract.methods.coins(1).call()


      //FIRST COIN
      const erc20Contract0 = new web3.eth.Contract(config.erc20ABI, coin0)

      const symbol0 = await erc20Contract0.methods.symbol().call();
      const decimals0 = await erc20Contract0.methods.decimals().call();
      const name0 = await erc20Contract0.methods.name().call();

      let balance0 = await erc20Contract0.methods.balanceOf(account.address).call();
      balance0 = parseFloat(balance0)/10**decimals0


      //SECOND COIN
      const erc20Contract1 = new web3.eth.Contract(config.erc20ABI, coin1)

      const symbol1 = await erc20Contract1.methods.symbol().call();
      const decimals1 = await erc20Contract1.methods.decimals().call();
      const name1 = await erc20Contract1.methods.name().call();

      let balance1 = await erc20Contract1.methods.balanceOf(account.address).call();
      balance1 = parseFloat(balance1)/10**decimals1


      callback(null, {
        symbol: symbol,
        decimals: decimals,
        name: name,
        balance: balance,
        assets: [
          {
            index: 0,
            erc20address: coin0,
            symbol: symbol0,
            decimals: decimals0,
            name: name0,
            balance: balance0
          },
          {
            index: 1,
            erc20address: coin1,
            symbol: symbol1,
            decimals: decimals1,
            name: name1,
            balance: balance1
          },
        ]
      })
    } catch(ex) {
      console.log(ex)
      return callback(ex)
    }
  }

  _getERC20Balance = async (web3, asset, account, callback) => {
    try {
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)

      let balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
      balance = parseFloat(balance)/10**asset.decimals
      callback(null, parseFloat(balance))
    } catch(ex) {
      console.log(ex)
      return callback(ex)
    }
  }

  deposit = async (payload) => {
    try {
      const { pool, firstAssetAmount, secondAssetAmount } = payload.content
      const account = store.getStore('account')
      const web3 = await this._getWeb3Provider();

      const firstAsset = pool.assets[0]
      const secondAsset = pool.assets[1]

      this._checkApproval(firstAsset, account, firstAssetAmount, pool.liquidityAddress, (err) => {
        if(err) {
          emitter.emit(ERROR, err);
          return emitter.emit(SNACKBAR_ERROR, err)
        }

        this._checkApproval(secondAsset, account, secondAssetAmount, pool.liquidityAddress, (err) => {
          if(err) {
            emitter.emit(ERROR, err);
            return emitter.emit(SNACKBAR_ERROR, err)
          }

          let amountToSend0 = web3.utils.toWei(firstAssetAmount, "ether")
          if (firstAsset.decimals !== 18) {
            const decimals = new BigNumber(10)
              .pow(firstAsset.decimals)

            amountToSend0 = new BigNumber(firstAssetAmount)
              .times(decimals)
              .toFixed(0);
          }

          let amountToSend1 = web3.utils.toWei(secondAssetAmount, "ether")
          if (secondAsset.decimals !== 18) {
            const decimals = new BigNumber(10)
              .pow(secondAsset.decimals)

            amountToSend1 = new BigNumber(secondAssetAmount)
              .times(decimals)
              .toFixed(0);
          }

          this._callAddLiquidity(web3, account, pool, amountToSend0, amountToSend1, (err, a) => {
            if(err) {
              emitter.emit(ERROR, err)
              return emitter.emit(SNACKBAR_ERROR, err)
            }

            emitter.emit(DEPOSIT_RETURNED)
          })

        })
      })
    } catch (ex) {
      emitter.emit(ERROR, ex)
      emitter.emit(SNACKBAR_ERROR, ex)
    }
  }

  _callAddLiquidity = async (web3, account, pool, amountToSend0, amountToSend1, callback) => {
    const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.liquidityAddress)

    const amountToReceive = await metapoolContract.methods.calc_token_amount([amountToSend0, amountToSend1], true).call()

    const receive = new BigNumber(amountToReceive)
      .times(95)
      .dividedBy(100)
      .toFixed(0);

    console.log([amountToSend0, amountToSend1], receive)

    metapoolContract.methods.add_liquidity([amountToSend0, amountToSend1], receive).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
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
      const web3 = await this._getWeb3Provider();

      let amountToSend = web3.utils.toWei(amount, "ether")
      if (pool.decimals !== 18) {
        const decimals = new BigNumber(10)
          .pow(pool.decimals)

        amountToSend = new BigNumber(amount)
          .times(decimals)
          .toFixed(0);
      }

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
    const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.liquidityAddress)

    //calcualte minimum amounts ?

    metapoolContract.methods.remove_liquidity(amountToSend, [0, 0]).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
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
      const web3 = await this._getWeb3Provider();

      let amountToSend = web3.utils.toWei(amount, "ether")
      if (from.decimals !== 18) {
        const decimals = new BigNumber(10)
          .pow(from.decimals)

        amountToSend = new BigNumber(amount)
          .times(decimals)
          .toFixed(0);
      }

      const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.liquidityAddress)
      const amountToReceive = await metapoolContract.methods.get_dy(from.index, to.index, amountToSend).call()

      const returnObj = {
        sendAmount: amount,
        receiveAmount: amountToReceive/10**to.decimals,
        receivePerSend: (amountToReceive*10**to.decimals)/(amountToSend*10**from.decimals),
        sendPerReceive: (amountToSend*10**from.decimals)/(amountToReceive*10**to.decimals),
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
      const web3 = await this._getWeb3Provider();

      this._checkApproval(from, account, amount, pool.liquidityAddress, async (err) => {
        if(err) {
          emitter.emit(ERROR, err);
          return emitter.emit(SNACKBAR_ERROR, err)
        }

        let amountToSend = web3.utils.toWei(amount, "ether")
        if (from.decimals !== 18) {
          const decimals = new BigNumber(10)
            .pow(from.decimals)

          amountToSend = new BigNumber(amount)
            .times(decimals)
            .toFixed(0);
        }

        const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.liquidityAddress)
        const amountToReceive = await metapoolContract.methods.get_dy(from.index, to.index, amountToSend).call()

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
    const metapoolContract = new web3.eth.Contract(config.metapoolABI, pool.liquidityAddress)

    const receive = new BigNumber(amountToReceive)
      .times(95)
      .dividedBy(100)
      .toFixed(0);

    metapoolContract.methods.exchange(from.index, to.index, amountToSend, receive).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
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

  _getGasPrice = async () => {
    try {
      const url = 'https://gasprice.poa.network/'
      const priceString = await rp(url);
      const priceJSON = JSON.parse(priceString)
      if(priceJSON) {
        return priceJSON.fast.toFixed(0)
      }
      return store.getStore('universalGasPrice')
    } catch(e) {
      console.log(e)
      return store.getStore('universalGasPrice')
    }
  }

  _getWeb3Provider = async () => {
    const web3context = store.getStore('web3context')

    if(!web3context) {
      return null
    }
    const provider = web3context.library.provider
    if(!provider) {
      return null
    }

    const web3 = new Web3(provider);

    return web3
  }
}

var store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
};
