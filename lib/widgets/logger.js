'use strict';

const contrib = require('blessed-contrib');
const format = require('blgr/lib/format');
const AbstractWidget = require('./abstract');

class Log extends AbstractWidget {
  constructor(options) {
    super(options);

    this.interactive = false;

    this.set(this.coords, contrib.log, {
      label: 'Debug Log',
      bufferLength: 100,
      tags: true
    });

    // Hijack hsd blgr stdout and redirect to widget
    this.node.logger.logger.writeConsole = (level, module, args) => {
      const msg = format(args, false);
      this.widget.log(msg);
    };
  }

  log(msg) {
    this.widget.log(`{blue-fg}${msg}{/blue-fg}`);
  }

  error(msg) {
    this.widget.log(`{red-fg}${msg}{/red-fg}`);
  }
}

module.exports = Log;
