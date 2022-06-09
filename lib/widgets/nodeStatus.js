/* eslint no-nested-ternary: off */

'use strict';

const contrib = require('../../src/blessed-contrib');
const AbstractWidget = require('./abstract');

class NodeStatus extends AbstractWidget {
  constructor(options) {
    super(options);

    this.interactive = true;

    this.set(this.coords, contrib.table, {
      label: 'Node Status',
      columnSpacing: 1,
      columnWidth: [10, 120],
      tags: true,
      selectedBg: 'default',
      selectedFg: 'green'
    });
  }

  refresh() {
    const chainHeight = this.node.chain.height;
    const walletHeight = this.app.wdb ? this.app.wdb.height : 0;

    // Note: the {style} tags actually count towards the padEnd() even though
    // the tags themselves are removed from the rendered display.
    // So these strings need extra awkward spaces before padEnd() is used.
    const chainProg = (this.node.chain.getProgress() * 100).toFixed(2);
    const chainString = chainProg < 90
                        ? `{red-fg}Chain: ${chainProg}%{/red-fg}`
                        : chainProg > 99.99
                          ? `{green-fg}Chain: ${chainProg}%{/green-fg}  `
                          : `{yellow-fg}Chain: ${chainProg}%{/yellow-fg}   `;

    const walletProg = ((walletHeight / chainHeight) * 100).toFixed(2);
    const walletString = walletProg < 90
                        ? `{red-fg}Wallet: ${walletProg}%{/red-fg}`
                        : walletProg > 99.99
                          ? `{green-fg}Wallet: ${walletProg}%{/green-fg}`
                          : `{yellow-fg}Wallet: ${walletProg}%{/yellow-fg}`;

    this.widget.setData({
      headers: [this.node.pool.options.agent],
      data: [
        ['Network', this.node.network.type],
        ['Height',
          `Chain: ${chainHeight}`.padEnd(16, ' ') +  `Wallet: ${walletHeight}`],
        ['Progress', chainString.padEnd(33, ' ') + walletString],
        ['Tip',     this.node.chain.tip.hash.toString('hex')],
        ['Outbound', this.node.pool.peers.outbound],
        ['Inbound', this.node.pool.peers.inbound]
      ]
    });
  }
}

module.exports = NodeStatus;
