'use strict';

const blessed = require('blessed');
const contrib = require('../../src/blessed-contrib');
const AbstractWidget = require('./abstract');

class AccountList extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Account List (A)'
    });
    this.table = contrib.table({
      parent: this.widget,
      mouse: true,
      keys: true,
      interactive: true,
      columnSpacing: 1,
      columnWidth: [4, 120]
    });
  }

  refresh() {
    const accountNames = [];
    const wallet = this.state.wallets[this.state.selectedWallet];
    if (!wallet)
      return;

    const accounts = wallet.accounts;
    for (const account in accounts) {
      const arrow =
        account ===  this.state.selectedAccount
          ? '>>'
          : '';
      accountNames.push([arrow, account]);
    }

    this.table.setData({
      headers: ['', this.state.selectedWallet],
      data: accountNames
    });
  }

  initWallet() {
    // Rows in table are clickable, choose account
    this.table.rows.on('select', async (node) => {
      // Text in rows are padded with tons of spaces for visual layout
      const words = node.content.trim().split(' ');
      const data = words[words.length - 1];
      this.state.selectedAccount = data;
      await this.app.getSelectedWalletHistory();
    });
  }
}

module.exports = AccountList;
