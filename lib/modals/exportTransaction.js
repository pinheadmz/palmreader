'use strict';

const Path = require('path');
const blessed = require('blessed');
const AbstractModal = require('./abstract');
const {copy, addButton, addExportFile} = require('../util');

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
      copy(this.state.hex, (err) => {
        if (err)
          this.app.error(err.message);
        else
          this.app.log('TX hex copied to clipboard');
      });
    });
    const {exportPath, exportButton} = addExportFile(this.widget);
    this.exportPath = exportPath;
    exportButton.on('press', () => {
      if (!this.hexDisplay.content.length) {
        this.app.error('Nothing to export');
      } else {
        this.app.exportFile(this.hexDisplay.content, exportPath.value);
      }
    });
  }

  refresh() {
    const hex = this.state.hex;
    if (!hex) {
      this.hexDisplay.content = 'No TX hex in state.';
      return;
    }
    this.hexDisplay.content = hex;
    this.exportPath.setValue(
      Path.join(this.state.exportDir, this.state.mtxFile)
    );
  }

  reset() {
    this.hexDisplay.content = '';
  }
}

module.exports = ExportTransaction;
