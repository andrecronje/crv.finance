import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress
} from '@material-ui/core';
import { colors } from '../../theme'

import Loader from '../loader'

import {
  ERROR,
  CONFIGURE_RETURNED,
  GET_BALANCES,
  BALANCES_RETURNED,
  DEPOSIT,
  DEPOSIT_RETURNED,
  WITHDRAW,
  WITHDRAW_RETURNED,
} from '../../constants'

import Store from "../../stores";
const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1200px',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  inputContainer: {
    display: 'flex',
    padding: '30px',
    borderRadius: '50px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    margin: '40px 0px',
    border: '1px solid '+colors.borderBlue,
    minWidth: '500px',
    background: colors.white
  },
  inputCardHeading: {
    width: '100%',
    color: colors.darkGray,
    paddingLeft: '12px'
  },
  valContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: '24px'
  },
  balances: {
    textAlign: 'right',
    paddingRight: '20px',
    cursor: 'pointer'
  },
  assetSelectMenu: {
    padding: '15px 15px 15px 20px',
    minWidth: '300px',
    display: 'flex'
  },
  assetSelectIcon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderRadius: '25px',
    background: '#dedede',
    height: '30px',
    width: '30px',
    textAlign: 'center',
    cursor: 'pointer',
    marginRight: '12px'
  },
  assetSelectIconName: {
    display: 'inline-block',
    verticalAlign: 'middle',
    flex: 1
  },
  assetSelectBalance: {
    paddingLeft: '24px'
  },
  assetAdornment: {
    color: colors.text + ' !important'
  },
  assetContainer: {
    minWidth: '120px'
  },
  actionButton: {
    '&:hover': {
      backgroundColor: "#2F80ED",
    },
    marginTop: '24px',
    padding: '12px',
    backgroundColor: "#2F80ED",
    borderRadius: '1rem',
    border: '1px solid #E1E1E1',
    fontWeight: 500,
    [theme.breakpoints.up('md')]: {
      padding: '15px',
    }
  },
  buttonText: {
    fontWeight: '700',
    color: 'white',
  },
  priceContainer: {
    display: 'flex',
    justifyContent: 'space-evenly',
    width: '100%',
    background: '#dedede',
    borderRadius: '24px',
    padding: '24px'
  },
  priceHeading: {
    paddingBottom: '12px'
  },
  priceConversion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  conversionDirection: {
    color: colors.darkGray
  },
  toggleContainer: {
    width: '100%',
    display: 'flex',
  },
  toggleHeading: {
    flex: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '24px',
    color: colors.darkGray
  },
  toggleHeadingActive: {
    flex: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '24px',
    color: colors.text
  },
  flexy: {
    width: '100%',
    display: 'flex'
  },
  label: {
    flex: 1,
    paddingLeft: '12px'
  },
  assetSelectRoot: {
  }
});

class Liquidity extends Component {

  constructor(props) {
    super()

    const account = store.getStore('account')
    const pools = store.getStore('pools')

    this.state = {
      assets: store.getStore('assets'),
      account: account,
      pools: pools,
      pool: pools && pools.length > 0 ? pools[0].symbol : '',

      poolAmount: '',
      poolAmountError: '',
      loading: !(pools && pools.length > 0 && pools[0].assets.length > 0),
      activeTab: 'deposit',
    }

    if(account && account.address) {
      dispatcher.dispatch({ type: GET_BALANCES, content: {} })
    }
  }
  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(BALANCES_RETURNED, this.balancesReturned);
    emitter.on(CONFIGURE_RETURNED, this.configureReturned);
    emitter.on(DEPOSIT_RETURNED, this.depositReturned);
    emitter.on(WITHDRAW_RETURNED, this.withdrawReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(BALANCES_RETURNED, this.balancesReturned);
    emitter.removeListener(CONFIGURE_RETURNED, this.configureReturned);
    emitter.removeListener(DEPOSIT_RETURNED, this.depositReturned);
    emitter.removeListener(WITHDRAW_RETURNED, this.withdrawReturned);
  };

  configureReturned = () => {

    const pools = store.getStore('pools')

    this.setState({
      account: store.getStore('account'),
      pools: pools,
      pool: pools && pools.length > 0 ? pools[0].symbol : '',
      loading: false,
    })

    const val = []
    val[pools[0].assets[0].symbol+'Amount'] = pools[0].assets[0].balance.toFixed(pools[0].assets[0].decimals)
    val[pools[0].assets[1].symbol+'Amount'] = pools[0].assets[1].balance.toFixed(pools[0].assets[1].decimals)
    this.setState(val)

    dispatcher.dispatch({ type: GET_BALANCES, content: {} })
  };

  balancesReturned = (balances) => {

    const pools = store.getStore('pools')

    this.setState({
      pools: pools,
      pool: pools && pools.length > 0 ? pools[0].symbol : '',
    })
  };

  depositReturned = () => {
    this.setState({ loading: false })
  }

  withdrawReturned = () => {
    this.setState({ loading: false })
  }

  errorReturned = (error) => {
    this.setState({ loading: false })
  };

  render() {
    const { classes } = this.props;
    const {
      loading,
      account,
      activeTab,
    } = this.state

    if(!account || !account.address) {
      return (<div></div>)
    }

    return (
      <div className={ classes.root }>
        <div className={ classes.inputContainer }>
          <div className={ classes.toggleContainer }>
            <Typography variant='h3' className={ activeTab === 'deposit' ? classes.toggleHeadingActive : classes.toggleHeading } onClick={ () => { this.toggleDeposit() }}>Deposit</Typography>
            <Typography variant='h3' className={ activeTab === 'withdraw' ? classes.toggleHeadingActive : classes.toggleHeading } onClick={ () => { this.toggleWithdraw() }}>Withdraw</Typography>
          </div>
          {
            activeTab === 'deposit' && this.renderDeposit()
          }
          {
            activeTab === 'withdraw' && this.renderWithdraw()
          }
        </div>
        { loading && <Loader /> }
      </div>
    )
  };

  renderPoolSelectInput = () => {
    const {
      classes
    } = this.props

    const {
      loading,
      pools,
      pool,
      poolAmount,
      poolAmountError
    } = this.state

    const thePool = pools.filter((p) => {
      return p.id === pool
    })[0]

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>pool</Typography>
          </div>
          <div className={ classes.balances }>
            { (thePool ? (<Typography variant='h4' onClick={ () => { this.setAmount(thePool.symbol, 'pool', (thePool ? thePool.balance.toFixed(thePool.decimals) : '0')) } } className={ classes.value } noWrap>{ ''+ ( thePool && thePool.balance ? (Math.floor(thePool.balance*10000)/10000).toFixed(4) : '0.0000') } { thePool ? thePool.symbol : '' }</Typography>) : <Typography variant='h4' className={ classes.value } noWrap>Balance: -</Typography>) }
          </div>
        </div>
        <div>
          <TextField
            fullWidth
            disabled={ loading }
            className={ classes.actionInput }
            id={ 'poolAmount' }
            value={ poolAmount }
            error={ poolAmountError }
            onChange={ this.onChange }
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              endAdornment: <div className={ classes.assetContainer }>{ this.renderPoolSelectAsset("pool") }</div>,
            }}
          />
        </div>
      </div>
    )
  }

  renderPoolSelectAsset = (id) => {
    const { loading, pools } = this.state
    const { classes } = this.props

    return (
      <TextField
        id={ id }
        name={ id }
        select
        value={ this.state[id] }
        onChange={ this.onPoolSelectChange }
        SelectProps={{
          native: false,
        }}
        fullWidth
        disabled={ loading }
        placeholder={ 'Select' }
        className={ classes.assetSelectRoot }
      >
        { pools ? pools.map(this.renderPoolSelectAssetOptions) : null }
      </TextField>
    )
  }

  renderPoolSelectAssetOptions = (option) => {
    const { classes } = this.props

    return (
      <MenuItem key={option.symbol} value={option.symbol} className={ classes.assetSelectMenu }>
        <React.Fragment>
          <div className={ classes.assetSelectIcon }>
            <img
              alt=""
              src={ this.getLogoForAsset(option) }
              height="30px"
            />
          </div>
          <div className={ classes.assetSelectIconName }>
            <Typography variant='h4'>{ option.symbol }</Typography>
          </div>
        </React.Fragment>
      </MenuItem>
    )
  }

  renderPoolSelect = (id) => {
    const { loading, pools, pool } = this.state
    const { classes } = this.props

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>pool</Typography>
          </div>
          <div className={ classes.balances }>
          </div>
        </div>
        <div>
          <TextField
            id={ 'pool' }
            name={ 'pool' }
            select
            value={ pool }
            onChange={ this.onPoolSelectChange }
            SelectProps={{
              native: false,
              renderValue: (option) => {
                return (
                  <div className={ classes.assetSelectIconName }>
                    <Typography variant='h4'>{ option }</Typography>
                  </div>
                )
              }
            }}
            fullWidth
            variant="outlined"
            disabled={ loading }
            className={ classes.actionInput }
            placeholder={ 'Select' }
          >
            { pools ? pools.map((pool) => { return this.renderPoolOption(pool) }) : null }
          </TextField>
        </div>
      </div>
    )
  }

  renderPoolOption = (option) => {
    const { classes } = this.props

    return (
      <MenuItem key={option.symbol} value={option.symbol} className={ classes.assetSelectMenu }>
        <React.Fragment>
          <div className={ classes.assetSelectIcon }>
            <img
              alt=""
              src={ this.getLogoForAsset(option) }
              height="30px"
            />
          </div>
          <div className={ classes.assetSelectIconName }>
            <Typography variant='h4'>{ option.symbol }</Typography>
          </div>
        </React.Fragment>
      </MenuItem>
    )
  }

  renderDeposit = () => {
    const { classes } = this.props;
    const {
      loading,
      pools,
      pool
    } = this.state

    const thePool = this.state.pools.filter((p) => {
      return p.id === pool
    })[0]

    return (
      <React.Fragment>
        { this.renderPoolSelect() }
        {
          thePool && thePool.assets && thePool.assets.length > 0 && thePool.assets.map((p) => {
            return this.renderAssetInput(p, 'deposit')
          })
        }
        <Button
          className={ classes.actionButton }
          variant="outlined"
          color="primary"
          disabled={ loading }
          onClick={ this.onDeposit }
          fullWidth
          >
          <Typography className={ classes.buttonText } variant={ 'h4'} color='secondary'>{ 'Deposit' }</Typography>
        </Button>
      </React.Fragment>
    )
  }

  renderWithdraw = () => {
    const { classes } = this.props;
    const {
      loading,
      pools,
      pool
    } = this.state

    const thePool = this.state.pools.filter((p) => {
      return p.id === pool
    })[0]

    return (
      <React.Fragment>
        { this.renderPoolSelectInput() }
        {
          /*
          thePool && thePool.assets && thePool.assets.length > 0 && thePool.assets.map((p) => {
            return this.renderAssetInput(p, 'withdraw')
          })
          */
        }
        <Button
          className={ classes.actionButton }
          variant="outlined"
          color="primary"
          disabled={ loading }
          onClick={ this.onWithdraw }
          fullWidth
          >
          <Typography className={ classes.buttonText } variant={ 'h4'} color='secondary'>{ 'Withdraw' }</Typography>
        </Button>
      </React.Fragment>
    )
  }

  startLoading = () => {
    this.setState({ loading: true })
  }

  renderAssetInput = (asset, DorW) => {
    const {
      classes
    } = this.props

    const {
      loading,
      assets
    } = this.state

    let type = asset.symbol

    const amount = this.state[type+"Amount"]
    const amountError = this.state[type+'AmountError']

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>
              { asset.name }
            </Typography>
          </div>
          <div className={ classes.balances }>
            { (asset ? (<Typography variant='h4' onClick={ () => { if(DorW === 'withdraw') { return false; } this.setAmount(asset.id, type, (asset ? asset.balance.toFixed(asset.decimals) : '0')) } } className={ classes.value } noWrap>{ ''+ ( asset && asset.balance ? (Math.floor(asset.balance*10000)/10000).toFixed(4) : '0.0000') } { asset ? asset.symbol : '' }</Typography>) : <Typography variant='h4' className={ classes.value } noWrap>Balance: -</Typography>) }
          </div>
        </div>
        <div>
          <TextField
            fullWidth
            disabled={ loading || DorW === 'withdraw' }
            className={ classes.actionInput }
            id={ type+"Amount" }
            value={ amount }
            error={ amountError }
            onChange={ this.onChange }
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              startAdornment: <div className={ classes.assetSelectIcon }>
                <img
                  alt=""
                  src={ this.getLogoForAsset(asset) }
                  height="30px"
                />
              </div>,
            }}
          />
        </div>
      </div>
    )
  }

  getLogoForAsset = (asset) => {
    try {
      return require('../../assets/tokens/'+asset.symbol+'-logo.png')
    } catch {
      return require('../../assets/tokens/unknown-logo.png')
    }
  }

  onPoolSelectChange = (event) => {
    let val = []
    val[event.target.name] = event.target.value
    this.setState(val)
  }

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  }

  setAmount = (id, type, balance) => {
    let val = []
    val[type+"Amount"] = balance
    this.setState(val)
  }

  toggleDeposit = () => {
    this.setState({ activeTab: 'deposit', poolAmount: '' })

    const { pools, pool } = this.state

    const thePool = pools.filter((p) => {
      return p.symbol === pool
    })[0]

    if(!thePool) {
      return false
    }

    const val = []
    val[thePool.assets[0].symbol+'Amount'] = thePool.assets[0].balance.toFixed(thePool.assets[0].decimals)
    val[thePool.assets[1].symbol+'Amount'] = thePool.assets[1].balance.toFixed(thePool.assets[1].decimals)
    this.setState(val)
  }

  toggleWithdraw = () => {
    this.setState({ activeTab: 'withdraw', poolAmount: '' })

    const { pools, pool } = this.state

    const thePool = pools.filter((p) => {
      return p.symbol === pool
    })[0]

    if(!thePool) {
      return false
    }

    const val = []
    val[thePool.assets[0].symbol+'Amount'] = ''
    val[thePool.assets[1].symbol+'Amount'] = ''
    this.setState(val)

    //mmaybe do calculation for estimated amounts
  }

  onDeposit = () => {
    const {
      pool,
      pools
    } = this.state

    let error = false

    const thePool = pools.filter((p) => {
      return p.symbol === pool
    })[0]

    const firstAsset = thePool.assets[0]
    const secondAsset = thePool.assets[1]

    const firstAssetAmount = this.state[firstAsset.symbol+'Amount']
    const secondAssetAmount = this.state[secondAsset.symbol+'Amount']

    const errVal = []
    errVal[firstAsset.symbol+'AmountError'] = false
    errVal[secondAsset.symbol+'AmountError'] = false
    this.setState(errVal)


    if(firstAssetAmount > firstAsset.balance) {
      const val = []
      val[firstAsset.symbol+'AmountError'] = true
      this.setState(val)
      error = true
    }

    if(secondAssetAmount > secondAsset.balance) {
      const val = []
      val[secondAsset.symbol+'AmountError'] = true
      this.setState(val)
      error = true
    }

    if(!error) {
      this.setState({ loading: true })
      dispatcher.dispatch({ type: DEPOSIT, content: { pool: thePool, firstAssetAmount: firstAssetAmount, secondAssetAmount: secondAssetAmount } })
    }
  }

  onWithdraw = () => {
    this.setState({ poolAmountError: false })

    const { poolAmount, pool, pools } = this.state

    const thePool = pools.filter((p) => {
      return p.id === pool
    })[0]

    if(!poolAmount || isNaN(poolAmount) || poolAmount <= 0 || poolAmount > thePool.balance) {
      this.setState({ poolAmountError: true })
      return false
    }

    this.setState({ loading: true })
    dispatcher.dispatch({ type: WITHDRAW, content: { amount: poolAmount, pool: thePool } })
  }
}

export default withRouter(withStyles(styles)(Liquidity));
