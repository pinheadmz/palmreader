/* eslint-disable new-cap */

'use strict';

const blessed = require('blessed');
const contrib = require('../src/blessed-contrib');

class Page {
  constructor(title, app) {
    this.title = title;
    this.app = app;

    // Covers up a bug in blessed where fragments of "hidden" objects
    // still appear between the cracks of other visible objects.
    // This is just a big black curtain that hangs behind the grid
    // and will be redrawn to cover up those fragments when screen is rendered.
    this.box = blessed.box({
      parent: this.app.screen,
      top: 1,
      left: 0,
      right: 0,
      bottom: 0,
      bg: 'black'
    });
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.box
    });

    this.index = this.app.pages.push(this) - 1;
  }
}

module.exports = Page;
