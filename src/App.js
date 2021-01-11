import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import {
  Switch,
  Route
} from "react-router-dom";
import IpfsRouter from 'ipfs-react-router'

import interestTheme from './theme';

import Header from './components/header';
import Footer from './components/footer';
import Disclaimer from './components/disclaimer';
import SnackbarController from './components/snackbar';
import Account from './components/account';
import Swap from './components/swap';
import Liquidity from './components/liquidity';

import { injected } from "./stores/connectors";

import {
  CONNECTION_CONNECTED,
  CONNECTION_DISCONNECTED,
  CONFIGURE,
} from './constants'

import Store from "./stores";
const emitter = Store.emitter
const store = Store.store
const dispatcher = Store.dispatcher

class App extends Component {
  state = {
    account: null,
  };

  componentWillMount() {
    emitter.on(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.on(CONNECTION_DISCONNECTED, this.connectionDisconnected);

    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        injected.activate()
        .then((a) => {
          store.setStore({ account: { address: a.account }, web3context: { library: { provider: a.provider } } })
          emitter.emit(CONNECTION_CONNECTED)
          console.log(a)
        })
        .catch((e) => {
          console.log(e)
        })
      } else {

      }
    });
  }

  componentWillUnmount() {
    emitter.removeListener(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.removeListener(CONNECTION_DISCONNECTED, this.connectionDisconnected);
  };

  connectionConnected = () => {
    this.setState({ account: store.getStore('account') })
    dispatcher.dispatch({ type: CONFIGURE, content: {} })
  };

  connectionDisconnected = () => {
    this.setState({ account: null })
  }

  render() {
    const { account } = this.state

    return (
      <MuiThemeProvider theme={ createMuiTheme(interestTheme) }>
        <CssBaseline />
        <IpfsRouter>
          { !account &&
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              minWidth: '100vw',
              justifyContent: 'center',
              alignItems: 'center',
              background: "#f9fafb"
            }}>
              <Account />
            </div>
          }
          { account &&
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              alignItems: 'center',
              background: "#f9fafb"
            }}>
              <Header />
              <Disclaimer />
              <Switch>
                <Route path='/liquidty'>
                  <Liquidity />
                </Route>
                <Route path="/swap">
                  <Swap />
                </Route>
                <Route path="/">
                  <Swap />
                </Route>
              </Switch>
            </div>
          }
          <SnackbarController />
        </IpfsRouter>
      </MuiThemeProvider>
    );
  }
}

export default App;
