'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputV, addButton, hsd} = require('../util');
const {MTX} = hsd;

class ImportTransaction extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Import Transaction (I)'
    });
    addInputV(
      this.widget,
      'Paste Transaction Hex:',
      'hex',
      {
        top: 1,
        left: 1,
        right: 1,
        bottom: 5
      }
    );
    addButton(
      this.widget,
      'Import TX',
      {
        bottom: 1,
        right: 1
      }
    ).on('press', async () => {
      return this.importTransaction();
    });
  }

  async importTransaction() {
    try {
      const {hex} = this.widget.submit();
      const mtx = MTX.fromHex(hex);
      await this.app.signTX(mtx);
    } catch (e) {
      this.app.log(e.message);
    } finally {
      // This method clears all inputs
      this.widget.reset();
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = ImportTransaction;
