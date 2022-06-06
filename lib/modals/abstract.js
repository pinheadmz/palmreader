'use strict';

const blessed = require('blessed');
const {addButton} = require('../util');

class AbstractModal {
  constructor(options) {
    this.app = options.app;
    this.node = this.app.node;
    this.screen = this.app.screen;
    this.grid = this.app.grid;
    this.state = this.app.state;
    this.focusKeys = options.focusKeys;

    this.widget = null;
    this.interactive = true;

    // This box is a transparent layer that covers the
    // background and steals all mouse clicks so nothing
    // else can take focus from the modal widget
    this.box = blessed.box({
      parent: this.screen,
      hidden: true,
      top: 1,
      left: 0,
      right: 0,
      bottom: 0,
      transparent: true
    });
    this.box.on('click', () => {});
  }

  // Create widget and add directly to screen
  set(obj, style) {
    if (this.interactive) {
      style.interactive = true;
      style.keys = true;
      style.mouse = true;
    } else {
      style.interactive = false;
    }

    style.parent = this.box;
    style.scrollable = true;
    style.border = {
      type: 'line',
      fg: 'red'
    };
    style.bg = 'black';
    style.width = 160;
    style.height = 40;
    style.top = 'center';
    style.left = 'center';
    this.widget = obj(style);

    // All modals get a close button for free
    addButton(
      this.widget,
      'Close',
      {
        bottom: 1,
        left: 1
      }
    ).on('press', () => {
      this.close();
    });

    // Open this modal on keypress
    if (this.focusKeys) {
      this.screen.key(this.focusKeys, () => {
        this.open();
      });
    }

    // Store all modals for refresh loops
    this.app.modals.push(this);
  }

  open() {
    // Hide all other modals
    this.app.modals.forEach((modal) => {
      modal.close();
    });
    // Show this one
    this.box.hidden = false;
    // Make sure we're on top of current page
    this.box.setIndex(100);
    this.widget.focus();
    this.refresh();
  }

  close() {
    this.box.hidden = true;
    this.reset();
  }

  // Update just before opening
  refresh() {
    ;
  }

  // Used to clear any form fields if modal is closed
  reset() {
    ;
  }
}

module.exports = AbstractModal;
