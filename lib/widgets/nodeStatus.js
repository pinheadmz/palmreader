'use strict';

const contrib = require('blessed-contrib');
const AbstractWidget = require('./abstract');

class NodeStatus extends AbstractWidget {
  constructor(options) {
    super(options);

    this.interactive = true;

    this.set(this.coords, contrib.table, {
      label: 'Node Status',
      columnSpacing: 1,
      columnWidth: [10, 120],
      selectedBg: 'default',
      selectedFg: 'green'
    });
  }

  refresh() {
    const chainHeight = this.node.chain.height;
    const walletHeight = this.app.wdb ? this.app.wdb.height : '?';

    this.widget.setData({
      headers: [this.node.pool.options.agent],
      data: [
        ['Network', this.node.network.type],
        ['Height',  `Chain: ${chainHeight}  Wallet: ${walletHeight}`],
        ['Tip',     this.node.chain.tip.hash.toString('hex')],
        ['Progress', this.node.chain.getProgress()],
        ['Outbound', this.node.pool.peers.outbound],
        ['Inbound', this.node.pool.peers.inbound]
      ]
    });
  }
}

module.exports = NodeStatus;
