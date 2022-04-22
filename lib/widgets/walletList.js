'use strict';

const contrib = require('blessed-contrib');
const AbstractWidget = require('./abstract');

class WalletList extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, contrib.table, {
      label: 'Wallet List (W)',
      columnSpacing: 1,
      columnWidth: [4, 120]
    });
  }

  // todo: add column to tabel with arrow pointing at selection

  refresh() {
    const wallets = [];
    for (const wallet in this.state.wallets) {
      const arrow =
        wallet === this.state.selectedWallet
          ? '>>'
          : '';
      wallets.push([arrow, wallet]);
    }

    this.widget.setData({
      headers: ['', this.state.walletPath],
      data: wallets
    });
  }

  initWallet() {
    // Rows in table are clickable, choose wallet
    this.widget.rows.on('select', async (node) => {
      // Text in rows are padded with tons of spaces for visual layout
      const words = node.content.trim().split(' ');
      const data = words[words.length - 1];
      return this.app.selectWallet(data);
    });
  }
}

module.exports = WalletList;
