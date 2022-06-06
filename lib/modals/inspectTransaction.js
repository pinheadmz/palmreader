'use strict';

const blessed = require('blessed');
const AbstractTXModal = require('./abstract-tx');
const {addButton, copy} = require('../util');

class InspectTransaction extends AbstractTXModal {
  constructor(options) {
    super(options);

    this.set(blessed.form, {
      label: 'Inspect Transaction'
    });
    this.afterSet();

    addButton(
      this.widget,
      'Copy TXID',
      {
        right: 1,
        bottom: 1
      }
    ).on('press', async () => {
      const txid = this.state.mtx.txid();
      copy(txid);
      this.app.log(`Copied txid to clipboard: ${txid}`);
    });
  }
}

module.exports = InspectTransaction;
