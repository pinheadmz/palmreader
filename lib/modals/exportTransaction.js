'use strict';

const blessed = require('blessed');
const AbstractModal = require('./abstract');
const {copy, addButton} = require('../util');

class ExportTransaction extends AbstractModal {
  constructor(options) {
    super(options);

    this.set(blessed.form, {
      label: 'Export Transaction Hex'
    });
    this.hexDisplay = blessed.text({
      parent: this.widget,
      top: 1,
      left: 'center',
      width: '75%',
      right: 1,
      bottom: 4,
      mouse: true,
      keys: true,
      interactive: true,
      scrollable: true,
      fg: 'green'
   });
    addButton(
      this.widget,
      'Copy Hex',
      {
        bottom: 1,
        right: 1
      }
    ).on('press', () => {
      copy(this.state.hex);
      this.app.log('TX hex copied to clipboard');
    });
  }

  refresh() {
    const hex = this.state.hex;
    if (!hex) {
      this.hexDisplay.content = 'No TX hex in state.';
      return;
    }
    this.hexDisplay.content = hex;
  }

  reset() {
    this.hexDisplay.content = '';
  }
}

module.exports = ExportTransaction;
