'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputV, addButton} = require('../util');
const {HID, LedgerHSD} = require('hsd-ledger');
const {Device} = HID;

class CreateAccount extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Create Account (E)'
    });
    addInputV(
      this.widget,
      'Name:',
      'name',
      {
        height: 1
      }
    );
    this.passphraseInput = addInputV(
      this.widget,
      'Passphrase:',
      'passphrase',
      {
        censor: true,
        height: 1,
        top: 3
      }
    );
    this.button = addButton(
      this.widget,
      'Create',
      {
        bottom: 1,
        right: 1,
        height: 1,
        padding: 0
      }
    );
    this.button.on('press', async () => {
      return this.createAccount();
    });
  }

  refresh() {
    // Fetch wallet and account, set display for hot wallet or Ledger
    const info = this.state.getAccountInfo();
    if (info && info.watchOnly) {
      this.passphraseInput.hidden = true;
      this.passphraseInput.labelBox.hidden = true;
      this.button.content = 'Ledger';
    } else {
      this.passphraseInput.hidden = false;
      this.passphraseInput.labelBox.hidden = false;
      this.button.content = 'Create';
    }
  }

  async createAccount() {
    const wallet = this.state.getWallet();
    if (!wallet)
      return;

    let device;
    try {
      const {
        name,
        passphrase
      } = this.widget.submit();

      // copy default account options
      // which are set when creating the wallet
      const defaultAccount = await wallet.getAccount(0);

      let accountKey = null;
      if (defaultAccount.watchOnly) {
        // Get xpub from Ledger
        device = await Device.requestDevice();
        const ledger = new LedgerHSD({
          device: device,
          network: this.app.wdb.network.type
        });
        await device.open();
        const pubkey = await ledger.getAccountXPUB(
          wallet.accountDepth
        );
        accountKey = pubkey.xpubkey(this.app.wdb.network.type);
      }

      await wallet.createAccount(
        {
          name,
          m: defaultAccount.m,
          n: defaultAccount.n,
          watchOnly: defaultAccount.watchOnly,
          accountKey
        },
        passphrase
      );
      this.widget.reset();
      await this.app.loadWallet();
    } catch (e) {
      this.app.error(e.message);
    } finally {
      if (device)
        await device.close();
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = CreateAccount;
