'use strict';

const blessed = require('blessed');
const contrib = require('../../src/blessed-contrib');
const AbstractWidget = require('./abstract');

class WalletList extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Wallet List (W)'
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
    const wallets = [];
    for (const wallet in this.state.wallets) {
      const arrow =
        wallet === this.state.selectedWallet
          ? '>>'
          : '';
      wallets.push([arrow, wallet]);
    }

    this.table.setData({
      headers: ['', this.state.walletPath],
      data: wallets
    });
  }

  initWallet() {
    // Rows in table are clickable, choose wallet
    this.table.rows.on('select', async (node) => {
      // Text in rows are padded with tons of spaces for visual layout
      const words = node.content.trim().split(' ');
      const data = words[words.length - 1];
      return this.app.selectWallet(data);
    });
  }
}

module.exports = WalletList;
