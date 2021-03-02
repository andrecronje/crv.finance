import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import PoolSeedingCTA from '../poolSeedingCTA'
import {
  Typography,
  TextField,
  MenuItem,
  Button,
} from '@material-ui/core';
import { colors } from '../../theme'

import Loader from '../loader'
import SlippageInfo from '../slippageInfo'
import { floatToFixed } from '../../utils/numbers'

import {
  ERROR,
  CONFIGURE_RETURNED,
  GET_BALANCES,
  BALANCES_RETURNED,
  DEPOSIT,
  DEPOSIT_RETURNED,
  WITHDRAW,
  WITHDRAW_RETURNED,
  GET_DEPOSIT_AMOUNT,
  GET_DEPOSIT_AMOUNT_RETURNED,
  GET_WITHDRAW_AMOUNT,
  GET_WITHDRAW_AMOUNT_RETURNED,
  SLIPPAGE_INFO_RETURNED,
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
  },
  space: {
    height: '24px'
  }
});

class Liquidity extends Component {

  constructor(props) {
    super()

    const account = store.getStore('account')
    const pools = store.getStore('pools')

    const preSelectedPoolMatches = window.location.hash.match(/pool=([a-z0-9/-]+)/i);
    const preSelectedPool = preSelectedPoolMatches === null ? null : preSelectedPoolMatches[1];

    const selectedPool = (
      !pools || pools.length === 0 ? null :
      preSelectedPool !== null ? pools.find(({ id }) => id === preSelectedPool) :
      pools[0]
    );

    this.state = {
      account: account,
      pools: pools,
      pool: selectedPool ? selectedPool.symbol : '',
      selectedPool: selectedPool,
      poolAmount: '',
      poolAmountError: '',
      loading: !(pools && pools.length > 0 && pools[0].assets.length > 0),
      activeTab: 'deposit',
    }

    // if(account && account.address) {
      // dispatcher.dispatch({ type: GET_BALANCES, content: {} })
    // }
  }
  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(BALANCES_RETURNED, this.balancesReturned);
    emitter.on(CONFIGURE_RETURNED, this.configureReturned);
    emitter.on(DEPOSIT_RETURNED, this.depositReturned);
    emitter.on(WITHDRAW_RETURNED, this.withdrawReturned);
    emitter.on(GET_DEPOSIT_AMOUNT_RETURNED, this.getDepositAmountReturned);
    emitter.on(GET_WITHDRAW_AMOUNT_RETURNED, this.getWithdrawAmountReturned);
    emitter.on(SLIPPAGE_INFO_RETURNED, this.slippageInfoReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(BALANCES_RETURNED, this.balancesReturned);
    emitter.removeListener(CONFIGURE_RETURNED, this.configureReturned);
    emitter.removeListener(DEPOSIT_RETURNED, this.depositReturned);
    emitter.removeListener(WITHDRAW_RETURNED, this.withdrawReturned);
    emitter.removeListener(GET_DEPOSIT_AMOUNT_RETURNED, this.getDepositAmountReturned);
    emitter.removeListener(GET_WITHDRAW_AMOUNT_RETURNED, this.getWithdrawAmountReturned);
    emitter.removeListener(SLIPPAGE_INFO_RETURNED, this.slippageInfoReturned);
  };

  configureReturned = () => {
    const pools = store.getStore('pools')
    const selectedPool = pools && pools.length > 0 ? pools[0] : null
    const newStateSlice = {
      account: store.getStore('account'),
      pools: pools,
      pool: selectedPool ? selectedPool.symbol : '',
      selectedPool,
      loading: false,
      ...this.getStateSliceUserBalancesForSelectedPool(selectedPool),
    };

    this.setState(newStateSlice);

    if (!selectedPool) return;

    this.getDepositAmount(newStateSlice);
  };

  // Returns hash map of user balances for selected pool, e.g. { BACAmount: '2.00', USDTAmount: '3.00', … }
  getStateSliceUserBalancesForSelectedPool = (selectedPool) => {
    if (!selectedPool) return {}

    return Object.assign({}, ...selectedPool.assets.map(({ symbol, balance, decimals }) => ({
      [`${symbol}Amount`]: floatToFixed(balance, decimals)
    })))
  }

  getDepositAmount = (newStateSlice = {}) => {
    const futureState = {
      ...this.state,
      ...newStateSlice,
    };

    const { selectedPool } = futureState;
    if (!selectedPool) return;

    this.setState({
      depositAmount: '',
    });

    if (!selectedPool.isPoolSeeded) return;

    const amounts = selectedPool.assets
      .map(({ symbol }) => futureState[`${symbol}Amount`]) // Gather balances for that pool from state
      .map((amount) => (amount === '' || isNaN(amount)) ? 0 : amount) // Sanitize

    dispatcher.dispatch({ type: GET_DEPOSIT_AMOUNT, content: { pool: selectedPool, amounts }})
  }

  getDepositAmountReturned = (val) => {
    console.log(val)
    this.setState({ depositAmount: val })
  }

  getWithdrawAmountReturned = (vals) => {
    this.setState({ withdrawAmounts: vals })
  }

  balancesReturned = (balances) => {
    const pools = store.getStore('pools')

    this.setState({
      pools: pools,
      pool: pools && pools.length > 0 ? pools[0].symbol : '',
    })
  };

  slippageInfoReturned = ({ slippagePcent }) => {
    this.setState({ slippagePcent })
  }

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
      poolAmountError,
      selectedPool
    } = this.state

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>pool</Typography>
          </div>
          <div className={ classes.balances }>
            { (selectedPool ? (<Typography variant='h4' onClick={ () => { this.setAmount('pool', (selectedPool ? floatToFixed(selectedPool.balance, selectedPool.decimals) : '0')) } } className={ classes.value } noWrap>{ ''+ ( selectedPool && selectedPool.balance ? floatToFixed(selectedPool.balance, 4) : '0.0000') } { selectedPool ? selectedPool.symbol : '' }</Typography>) : <Typography variant='h4' className={ classes.value } noWrap>Balance: -</Typography>) }
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
            <Typography variant='h4'>{ option.name }</Typography>
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
      pool,
      selectedPool
    } = this.state

    return (
      <React.Fragment>
        { this.renderPoolSelect() }
        {(selectedPool && !selectedPool.isPoolSeeded) &&
          <PoolSeedingCTA pool={selectedPool} isDepositForm />}
        <div className={ classes.space }></div>
        {
          selectedPool && selectedPool.assets && selectedPool.assets.length > 0 && selectedPool.assets.map((p) => {
            return this.renderAssetInput(p, 'deposit')
          })
        }
        <div className={ classes.space }></div>
        { this.renderDepositAmount() }
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

  renderDepositAmount = () => {
    const {
      classes
    } = this.props

    const {
      depositAmount,
      slippagePcent,
      selectedPool
    } = this.state

    if (selectedPool && !selectedPool.isPoolSeeded) return null;

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>
              Receive
            </Typography>
          </div>
          <div className={ classes.balances }>
          </div>
        </div>
        <div>
          <TextField
            fullWidth
            disabled={ true }
            className={ classes.actionInput }
            id={ "depositAmount" }
            value={ depositAmount }
            placeholder="0.00"
            variant="outlined"
            type="number"
            InputProps={{
              startAdornment: <div className={ classes.assetSelectIcon }>
                <img
                  alt=""
                  src={ this.getLogoForAsset(selectedPool) }
                  height="30px"
                />
              </div>,
              endAdornment: <Typography variant='h5' style={{ minWidth: '90px', textAlign: 'right' }}>{selectedPool ? selectedPool.symbol : ''}</Typography>
            }}
          />
        </div>
        <SlippageInfo slippagePcent={slippagePcent} />
      </div>
    )
  }

  renderWithdraw = () => {
    const { classes } = this.props;
    const {
      loading,
      pools,
      pool,
    } = this.state

    return (
      <React.Fragment>
        { this.renderPoolSelectInput() }
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
            { (asset ? (<Typography variant='h4' onClick={ () => { if(DorW === 'withdraw') { return false; } this.setAmount(type, (asset ? floatToFixed(asset.balance, asset.decimals) : '0')) } } className={ classes.value } noWrap>{ ''+ ( asset && asset.balance ? floatToFixed(asset.balance, 4) : '0.0000') } { asset ? asset.symbol : '' }</Typography>) : <Typography variant='h4' className={ classes.value } noWrap>Balance: -</Typography>) }
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
            type="number"
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
    const selectedPool = this.state.pools.find((pool) => {
      return pool.id === event.target.value
    })

    const newStateSlice = {
      [event.target.name]: event.target.value,
      selectedPool,
      ...this.getStateSliceUserBalancesForSelectedPool(selectedPool),
    };

    this.setState(newStateSlice);
    this.getDepositAmount(newStateSlice);

    // If an url fragment was used to auto-select a pool, remove that
    // fragment when we change pool to revert to the naked /liquidity url.
    if (this.props.history.location.hash !== '') {
      this.props.history.replace('/liquidity');
    }
  }

  onChange = (event) => {
    const newStateSlice = {
      [event.target.id]: event.target.value
    }

    this.setState(newStateSlice);
    this.getDepositAmount(newStateSlice);
  }

  setAmount = (symbol, balance) => {
    const newStateSlice = {
      [`${symbol}Amount`]: balance,
    };

    this.setState(newStateSlice);
    this.getDepositAmount(newStateSlice);
  }

  toggleDeposit = () => {
    this.setState({ activeTab: 'deposit', poolAmount: '' })

    const {
      pools,
      pool,
      selectedPool
    } = this.state

    if(!selectedPool) {
      return false
    }

    const val = []
    val[selectedPool.assets[0].symbol+'Amount'] = floatToFixed(selectedPool.assets[0].balance, selectedPool.assets[0].decimals)
    val[selectedPool.assets[1].symbol+'Amount'] = floatToFixed(selectedPool.assets[1].balance, selectedPool.assets[1].decimals)
    this.setState(val)
  }

  toggleWithdraw = () => {
    this.setState({ activeTab: 'withdraw', poolAmount: '' })

    const {
      pools,
      pool,
      selectedPool
    } = this.state

    if(!selectedPool) {
      return false
    }

    const val = []
    val[selectedPool.assets[0].symbol+'Amount'] = ''
    val[selectedPool.assets[1].symbol+'Amount'] = ''
    this.setState(val)

  }

  onDeposit = () => {
    const {
      pool,
      pools,
      selectedPool
    } = this.state

    let error = false

    let amounts = []

    for(let i = 0; i < selectedPool.assets.length; i++) {
      amounts.push(this.state[selectedPool.assets[i].symbol+'Amount'])
    }

    if(!error) {
      this.setState({ loading: true })
      dispatcher.dispatch({ type: DEPOSIT, content: { pool: selectedPool, amounts: amounts } })
    }
  }

  onWithdraw = () => {
    this.setState({ poolAmountError: false })

    const {
      poolAmount,
      pool,
      pools,
      selectedPool
    } = this.state

    if(!poolAmount || isNaN(poolAmount) || poolAmount <= 0 || poolAmount > selectedPool.balance) {
      this.setState({ poolAmountError: true })
      return false
    }

    this.setState({ loading: true })
    dispatcher.dispatch({ type: WITHDRAW, content: { amount: poolAmount, pool: selectedPool } })
  }
}

export default withRouter(withStyles(styles)(Liquidity));
