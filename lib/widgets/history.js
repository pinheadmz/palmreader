'use strict';

const contrib = require('blessed-contrib');
const AbstractWidget = require('./abstract');
const {doosToHNS} = require('../util');

class History extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, contrib.table, {
      label: 'Wallet History',
      columnSpacing: 1,
      columnWidth: [24, 12, 8, 16, 60]
    });
  }

  refresh() {
    const data = [];
    for (const tx of this.state.history) {
      const time = tx.time ? tx.time : tx.mtime;
      data.push([
        new Date(time * 1000).toLocaleString('en-US', { hour12: false }),
        tx.hash.slice(0, 8),
        tx.confirmations,
        doosToHNS(tx.balanceDelta).padStart(14, ' '),
        tx.actions
      ]);
    }
    this.widget.setData({
      headers: ['Time', 'txid', 'Conf.', 'Balance Δ', 'Actions'],
      data
    });
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = History;
