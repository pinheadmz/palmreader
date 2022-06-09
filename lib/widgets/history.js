'use strict';

const contrib = require('../../src/blessed-contrib');
const AbstractWidget = require('./abstract');
const {doosToHNS} = require('../util');

class History extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, contrib.table, {
      label: 'Wallet History (S)',
      columnSpacing: 1,
      columnWidth: [12, 24, 8, 16, 60]
    });
  }

  refresh() {
    const data = [];
    for (const tx of this.state.history) {
      const time = tx.time ? tx.time : tx.mtime;
      data.push([
        tx.hash.slice(0, 8),
        new Date(time * 1000).toLocaleString('en-US', { hour12: false }),
        tx.confirmations,
        doosToHNS(tx.balanceDelta).padStart(14, ' '),
        tx.actions.join(', ')
      ]);
    }
    this.widget.setData({
      headers: [' txid', ' Time', 'Conf.', '  Balance Δ', ' Actions'],
      data
    });
  }

  initWallet() {
    // Inspect historical transaction
    this.widget.rows.on('select', async (node) => {
      const words = node.content.split(' ');
      const txid = words[0];
      for (const json of this.state.history) {
        if (json.hash.slice(0, 8) === txid) {
          await this.app.inspectTX(json.tx);
          break;
        }
      }
    });
    this.bindChildren();
  }
}

module.exports = History;
