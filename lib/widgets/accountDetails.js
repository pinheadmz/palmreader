'use strict';

const blessed = require('blessed');
const contrib = require('../../src/blessed-contrib');
const AbstractWidget = require('./abstract');
const {copy, addInputH, addButton, doosToHNS} = require('../util');

class AccountDetails extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Details: Selected wallet / account (D)'
    });
    this.table = contrib.table({
      parent: this.widget,
      columnSpacing: 1,
      columnWidth: [20, 120],
      interactive: true,
      keys: true,
      mouse: true
    });
    this.xpubForm = blessed.form({
      parent: this.widget,
      bottom: 0,
      height: 3,
      hidden: true
    });
      this.xpubInput = addInputH(
        this.xpubForm,
        'Import xpub:',
        'xpub',
        {
          width: 80,
          bottom: 1
        }
      );
      this.submit = addButton(
        this.xpubForm,
        'Import',
        {
          bottom: 1,
          right: 1
        }
      ).on('press', async () => {
        return this.importXpub();
      });
  }

  async importXpub() {
    const wallet = this.state.getWallet();
    if (!wallet)
      return;
    try {
      await wallet.addSharedKey(
        this.state.selectedAccount,
        this.xpubInput.value
      );
      this.xpubForm.reset();
      await this.app.loadWallet();
    } catch (e) {
      this.app.error(e.message);
      this.xpubForm.reset();
    }
  }

  refresh() {
    const wid = this.state.selectedWallet;
    const wallet = this.state.wallets[wid];
    if (!wallet)
      return;

    const accountInfo = this.state.getAccountInfo();
    if (!accountInfo)
      return;

    let data = [[]];
    const group = [];

    for (const xpub of accountInfo.keys) {
      const label = group.length ? '' : 'Group xpubs';
      group.push([label, xpub]);
    }

    if (accountInfo.initialized) {
      const spendable = doosToHNS(
          accountInfo.balance.unconfirmed
        - accountInfo.balance.lockedUnconfirmed);
      const confirmed = doosToHNS(
          accountInfo.balance.confirmed
          - accountInfo.balance.lockedConfirmed);

      data = [
        ['Receive address', accountInfo.receiveAddress],
        ['Spendable balance', spendable],
        ['Confirmed balance', confirmed],
        ['M', accountInfo.m],
        ['N', accountInfo.n],
        ['Acct index', accountInfo.accountIndex],
        ['Receive depth', accountInfo.receiveDepth],
        ['Change depth', accountInfo.changeDepth],
        ['TX count', accountInfo.balance.tx],
        ['UTXO count', accountInfo.balance.coin],
        ['Watch only', accountInfo.watchOnly],
        ['My xpub', accountInfo.accountKey],
        ...group
      ];
      this.xpubForm.hidden = true;
    } else {
      data = [
        ['Initialized', false],
        ['M', accountInfo.m],
        ['N', accountInfo.n],
        ['Xpubs needed', accountInfo.n - 1 - accountInfo.keys.length],
        ['My xpub', accountInfo.accountKey],
        ...group
      ];
      this.xpubForm.hidden = false;
    }

    this.table.setData({
      headers: ['', `${wid} / ${accountInfo.name}`],
      data
    });
  }

  initWallet() {
    // Content in rows is copied to clipboard on [enter] or double-click
    this.table.rows.on('select', (node) => {
      const words = node.content.match(/\ *([\w\.]*)\ *$/);
      const value = words[words.length - 1];

      copy(value, (err) => {
        if (err)
          this.app.error(err.message);
        else
          this.app.log(`Copied to clipboard: ${value}`);
      });
    });
    this.bindChildren();
  }
}

module.exports = AccountDetails;
