import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  TextField,
  MenuItem,
  Button,
} from '@material-ui/core';
import { colors } from '../../theme'

import Loader from '../loader'

import {
  ERROR,
  CONFIGURE_RETURNED,
  GET_ASSET_INFO,
  GET_ASSET_INFO_RETURNED,
  ADD_POOL,
  ADD_POOL_RETURNED
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
    maxWidth: '900px',
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
    cursor: 'pointer'
  },
  assetSelectIconName: {
    paddingLeft: '10px',
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
  between: {
    width: '24px'
  },
  portfolioContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px'
  },
  titleBalance: {
    padding: '20px 10px',
    borderRadius: '50px',
    border: '1px solid '+colors.borderBlue,
    background: colors.white,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  inline: {
    display: 'flex',
    alignItems: 'baseline'
  },
  symbol: {
    paddingLeft: '6px'
  },
  gray: {
    color: colors.darkGray
  },
  assetInfoContainer: {
    width: '100%',
    background: colors.gray,
    borderRadius: '40px',
    padding: '24px'
  },
  assetInfo: {
    width: '100%',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  assetInfoContainerBase: {
    width: '100%',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly'
  },
  assetLogo: {
    marginRight: '10px'
  },
  assetField: {
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: '12px'
  },
  assetFieldName: {
    display: 'flex',
    flexDirection: 'column',
  },
  poolInfoHeader: {
    width: '100%',
    paddingBottom: '6px',
    paddingTop: '6px'
  },
  cont: {
    marginTop: '12px',
    width: '100%'
  },
  another: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  sepperator: {
    borderBottom: '1px solid #E1E1E1',
    margin: '24px',
  },
});

class AddPool extends Component {

  constructor(props) {
    super()

    const account = store.getStore('account')
    const pools = store.getStore('pools')
    const basePools = store.getStore('basePools')

    const selectedBasePool = basePools && basePools.length > 0 ? basePools[0] : null

    this.state = {
      account: store.getStore('account'),
      assetInfo: null,
      basePools: basePools,
      basePool: selectedBasePool ? selectedBasePool.name : '',
      selectedBasePool: selectedBasePool,
      tokenAddress: '',
      tokenAddressError: false,
      name: '',
      nameError: false,
      symbol: '',
      symbolError: false,
      a: '100',
      aError: false,
      fee: '4000000',
      feeError: false,
      loading: !(pools && pools.length > 0 && pools[0].assets.length > 0),
    }
  }
  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(CONFIGURE_RETURNED, this.configureReturned);
    emitter.on(GET_ASSET_INFO_RETURNED, this.getAssetInfoReturned);
    emitter.on(ADD_POOL_RETURNED, this.addPoolReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(CONFIGURE_RETURNED, this.configureReturned);
    emitter.removeListener(GET_ASSET_INFO_RETURNED, this.getAssetInfoReturned);
    emitter.removeListener(ADD_POOL_RETURNED, this.addPoolReturned);
  };

  configureReturned = () => {
    const pools = store.getStore('pools')

    this.setState({
      account: store.getStore('account'),
      pools: pools,
      loading: false
    })
  };

  connectionDisconnected = () => {
    this.setState({ account: store.getStore('account') })
  }

  getAssetInfoReturned = (assetInfo) => {
    this.setState({
      assetInfo: assetInfo,
      loading: false
    })
  }

  addPoolReturned = () => {
    this.setState({
      loading: false,
    })
  }

  errorReturned = (error) => {
    this.setState({ loading: false })
  };

  render() {
    const { classes } = this.props;
    const {
      loading,
      account,
    } = this.state

    if(!account || !account.address) {
      return (<div></div>)
    }

    return (
      <div className={ classes.root }>
        <div className={ classes.inputContainer }>
          <Typography variant='h2' align='center' className={ classes.poolInfoHeader }>Setup</Typography>
          { this.renderInput('name') }
          { this.renderInput('symbol') }
          { this.renderAddressInput() }
          { this.renderBasePoolSelect() }
          { this.renderAssetInfo() }
          <Button
            className={ classes.actionButton }
            variant="outlined"
            color="primary"
            disabled={ loading }
            onClick={ this.onAddPool }
            fullWidth
            >
            <Typography className={ classes.buttonText } variant={ 'h4'} color='secondary'>Create Pool</Typography>
          </Button>
        </div>
        { loading && <Loader /> }
      </div>
    )
  };

  renderInput = (id) => {
    const { loading } = this.state
    const { classes } = this.props

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>{id}</Typography>
          </div>
          <div className={ classes.balances }>
          </div>
        </div>
        <div>
          <TextField
            id={ id }
            name={ id }
            value={ this.state[id] }
            onChange={ this.onChange }
            fullWidth
            variant="outlined"
            disabled={ loading }
            className={ classes.actionInput }
          />
        </div>
      </div>
    )
  }

  renderAddressInput = () => {
    const { loading, tokenAddress } = this.state
    const { classes } = this.props

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>token address</Typography>
          </div>
          <div className={ classes.balances }>
          </div>
        </div>
        <div>
          <TextField
            id={ 'tokenAddress' }
            name={ 'tokenAddress' }
            value={ tokenAddress }
            onChange={ this.onAddressChange }
            fullWidth
            variant="outlined"
            disabled={ loading }
            className={ classes.actionInput }
          />
        </div>
      </div>
    )
  }

  renderBasePoolSelect = () => {
    const { loading, basePools, basePool } = this.state
    const { classes } = this.props

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.flexy }>
          <div className={ classes.label }>
            <Typography variant='h4'>base pool</Typography>
          </div>
          <div className={ classes.balances }>
          </div>
        </div>
        <div>
          <TextField
            id={ 'basePool' }
            name={ 'basePool' }
            select
            value={ basePool }
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
            { basePools ? basePools.map((basePool) => { return this.renderPoolOption(basePool) }) : null }
          </TextField>
        </div>
      </div>
    )
  }

  renderPoolOption = (option) => {
    const { classes } = this.props

    return (
      <MenuItem key={option.id} value={option.name} className={ classes.assetSelectMenu }>
        <div className={ classes.assetSelectIconName }>
          <Typography variant='h4'>{ option.name }</Typography>
        </div>
      </MenuItem>
    )
  }

  renderAssetInfo = () => {
    const { assetInfo, selectedBasePool, name, symbol, fee, a } = this.state
    const { classes } = this.props

    /*
    <div className={ classes.assetField }>
      <Typography variant='h3'>{ a }</Typography>
      <Typography variant='h4' className={ classes.gray }>a</Typography>
    </div>
    <div className={ classes.assetField }>
      <Typography variant='h3'>{ fee }%</Typography>
      <Typography variant='h4' className={ classes.gray }>fee</Typography>
    </div>
    */

    return (
      <div className={ classes.cont }>
        <Typography variant='h2' align='center' className={ classes.poolInfoHeader }>Your pool</Typography>
        <div className={ classes.assetInfoContainer }>
          <div className={ classes.assetField }>
            <Typography variant='h3'>{ name }</Typography>
            <Typography variant='h4' className={ classes.gray }>name</Typography>
          </div>
          <div className={ classes.assetField }>
            <Typography variant='h3'>{ symbol }</Typography>
            <Typography variant='h4' className={ classes.gray }>symbol</Typography>
          </div>

          <div className={ classes.sepperator }></div>
          { assetInfo && this.renderAsset(assetInfo) }
          <Typography variant='h2' align='center'  className={ classes.poolInfoHeader }>+</Typography>
          <div className={ classes.assetInfoContainerBase }>
            { selectedBasePool.assets.map((asset) => {
              return this.renderAssetBase(asset)
            })}
          </div>
        </div>
      </div>
    )
  }

  renderAssetBase = (asset) => {
    const { classes } = this.props

    return (
      <div className={ classes.another }>
        <div className={ classes.assetLogo }>
          <img
            alt=""
            src={ this.getLogoForAsset(asset) }
            height="40px"
          />
        </div>
        <div  className={ classes.assetFieldName }>
          <Typography variant='h3'>{ asset.symbol }</Typography>
        </div>
      </div>
    )
  }

  renderAsset = (asset) => {
    const { classes } = this.props

    return (
      <div className={ classes.assetInfo }>
        <div className={ classes.assetLogo }>
          <img
            alt=""
            src={ this.getLogoForAsset(asset) }
            height="40px"
          />
        </div>
        <div  className={ classes.assetFieldName }>
          <Typography variant='h3'>{ asset.name }</Typography>
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

  startLoading = () => {
    this.setState({ loading: true })
  }

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  }

  onAddressChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)

    this.setState({ assetInfo: null })
    if(event.target.value.length === 42) {
      this.setState({ loading: true })
      dispatcher.dispatch({ type: GET_ASSET_INFO, content: { address: event.target.value }})
    }
  }

  onPoolSelectChange = (event) => {
    let val = []
    val[event.target.name] = event.target.value
    this.setState(val)

    const thePool = this.state.basePools.filter((pool) => {
      return pool.name === event.target.value
    })

    //on change pool change assets as well
    this.setState({
      selectedBasePool: thePool[0]
    })
  }

  onAddPool = () => {
    this.setState({ nameError: false, symbolError: false, aError: false, feeError: false })

    const {
      tokenAddress,
      selectedBasePool,
      name,
      symbol,
      a,
      fee
    } = this.state

    let error = false

    if(!name || name === '') {
      this.setState({ nameError: true })
      error = true
    }

    if(!symbol || symbol === '') {
      this.setState({ symbolError: true })
      error = true
    }

    // if(!a || a === '') {
    //   this.setState({ aError: true })
    //   error = true
    // }

    if(!fee || fee === '') {
      this.setState({ feeError: true })
      error = true
    }

    if(!error) {
      this.setState({ loading: true })
      dispatcher.dispatch({ type: ADD_POOL, content: { basePool: selectedBasePool, address: tokenAddress, name, symbol, a, fee } })
    }
  }
}

export default withRouter(withStyles(styles)(AddPool));
