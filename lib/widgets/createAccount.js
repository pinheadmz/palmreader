'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputV, addButton} = require('../util');

class CreateAccount extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Create Account (R)'
    });
    addInputV(
      this.widget,
      'Name:',
      'name',
      {
        height: 1
      }
    );
    addInputV(
      this.widget,
      'Passphrase:',
      'passphrase',
      {
        censor: true,
        height: 1,
        top: 3
      }
    );
    addButton(
      this.widget,
      'Create',
      {
        bottom: 1,
        right: 1,
        height: 1,
        padding: 0
      }
    ).on('press', async () => {
      return this.createAccount();
    });
  }

  async createAccount() {
    const wallet = this.state.getWallet();
    try {
      const {
        name,
        passphrase
      } = this.widget.submit();
      // copy default account options
      // which are set when creating the wallet
      const defaultAccount = await wallet.getAccount(0);
      await wallet.createAccount(
        {
          name,
          m: defaultAccount.m,
          n: defaultAccount.n,
          watchOnly: defaultAccount.watchOnly
        },
        passphrase
        );
      this.widget.reset();
      await this.app.loadWallet();
    } catch (e) {
      this.app.log(e.message);
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = CreateAccount;
