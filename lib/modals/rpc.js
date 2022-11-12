/* eslint max-len: "off" */
'use strict';

const Path = require('path');
const blessed = require('blessed');
const AbstractModal = require('./abstract');
const {addInputH, addButton, addExportFile, copy} = require('../util');

class RPC extends AbstractModal {
  constructor(options) {
    super(options);

    this.set(blessed.form, {
      label: 'RPC (R)'
    });
    this.command = addInputH(
      this.widget,
      'Command with arguments:',
      'command',
      {
        top: 1
      }
    );
    this.command.key(['enter'], async () => {
      return this.execute();
    });
    addButton(
      this.widget,
      'Execute',
      {
        right: 1,
        top: 3
      }
    ).on('press', async () => {
      return this.execute();
    });
    this.output = blessed.text({
      parent: this.widget,
      top: 6,
      left: 1,
      right: 1,
      bottom: 4,
      mouse: true,
      keys: true,
      interactive: true,
      scrollable: true,
      fg: 'white',
      border: {
        type: 'line'
      }
    });
    addButton(
      this.widget,
      'Copy',
      {
        right: 1,
        bottom: 1
      }
    ).on('press', async () => {
      copy(this.output.content, (err) => {
        if (err)
          this.app.error(err.message);
        else
          this.app.log('RPC output copied to clipboard');
      });
    });
    const {exportPath, exportButton} = addExportFile(this.widget);
    this.exportPath = exportPath;
    exportButton.on('press', () => {
      if (!this.output.content.length) {
        this.app.error('Nothing to export');
      } else {
        this.app.exportFile(this.output.content, exportPath.value);
      }
    });
  }

  async execute() {
    let params = this.command.value.split(' ');
    const method = params.shift();
    this.exportPath.setValue(
      Path.join(this.state.exportDir, `${method}-${Date.now()}.json`)
    );

    // This is JavaScript, who cares about types ?!
    params = params.map((p) => {
      try {
        return JSON.parse(p);
      } catch (e) {
        return p;
      }
    });

    try {
      let ret = await this.node.rpc.call({method, params});

      if (ret.error && ret.error.message.match(/Method not found/)) {
        if (this.app.walletdb)
          ret = await this.app.walletdb.rpc.call({method, params});
      }

      this.output.content = JSON.stringify(ret, 2, ' ');
      this.screen.render();
    } catch (e) {
      this.output.content = e.message;
    }
  }

  refresh() {
    this.command.focus();
  }

  reset() {
    this.widget.reset();
    this.output.content = '';
  }
}

module.exports = RPC;
