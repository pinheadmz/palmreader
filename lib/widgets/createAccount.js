'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputH, addButton} = require('../util');
const {HID, LedgerHSD} = require('hsd-ledger');
const {Device} = HID;

class CreateAccount extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Create Account (E)'
    });
    addInputH(
      this.widget,
      '      Name:',
      'name',
      {
        top: 2
      }
    );
    this.passphraseInput = addInputH(
      this.widget,
      'Passphrase:',
      'passphrase',
      {
        censor: true,
        height: 1,
        top: 4
      }
    );
    this.button = addButton(
      this.widget,
      'Create',
      {
        right: 1,
        top: 6
      }
    );
    this.button.on('press', async () => {
      return this.createAccount();
    });
    this.list = blessed.text({
      parent: this.widget,
      top: 10,
      bottom: 1,
      scrollable: true,
      interactive: true,
      mouse: true,
      keys: true,
      left: 'center',
      width: '66%',
      tags: true,
      style: {
        fg: 'green'
      },
      border: {
        type: 'line',
        fg: 'white'
      }
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

    this.list.content = 'Current wallet: ';
    this.list.content += `{bold}${this.state.selectedWallet}{/bold}\n\n`;
    this.list.content += 'Current accounts:\n';
    for (const acct of Object.keys(
        this.state.wallets[this.state.selectedWallet].accounts)
      )
      this.list.content += ' {bold}' + acct + '{/bold}\n';
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

      if (!name)
        throw new Error('Account must have a name');

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
      this.app.log(`Account created: ${name}`);
    } catch (e) {
      this.app.error(e.message);
    } finally {
      await wallet.lock();
      if (device)
        await device.close();
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = CreateAccount;
