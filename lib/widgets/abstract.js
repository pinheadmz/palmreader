'use strict';

class AbstractWidget {
  constructor(options) {
    this.app = options.app;
    this.node = this.app.node;
    this.screen = this.app.screen;
    this.grid = this.app.grid;
    this.state = this.app.state;
    this.coords = options.coords;
    this.focusKeys = options.focusKeys;

    this.widget = null;
    this.interactive = true;
  }

  // Create widget and add to grid
  set(coords, obj, style) {
    if (this.interactive) {
      style.interactive = true;
      style.keys = true;
      style.mouse = true;
    } else {
      style.interactive = false;
    }

    this.widget = this.grid.set(...coords, obj, style);

    // Focus this widget on keypress
    if (this.focusKeys) {
      this.screen.key(this.focusKeys, async () => {
        // Block all focus keys if a modal is open
        if (!this.app.isModalOpen())
          await this.widget.focus();
      });

      // Highlight border around focused widget,
      // keep it highlighted if focused element is inside widget
      // (like a text field inside a form)
      this.widget.on('focus', () => {
        this.focusWidget();
      });
      this.widget.on('blur', () => {
        this.blurWidget();
      });
      this.bindChildren();
    }
  }

  // Listen for events from nested elements.
  // May need to be called inside initWallet()
  bindChildren() {
    this.widget.forDescendants((child) => {
      child.on('focus', () => {
        this.focusWidget();
      });
      child.forDescendants((grandchild) => {
        grandchild.on('focus', () => {
          this.focusWidget();
        });
      });
    });
    this.widget.forDescendants((child) => {
      child.on('blur', () => {
        this.blurWidget();
      });
      child.forDescendants((grandchild) => {
        grandchild.on('blur', () => {
          this.blurWidget();
        });
      });
    });
  }

  focusWidget() {
    this.widget.style.border.fg = 'red';
  }

  blurWidget() {
    this.widget.style.border.fg = 'cyan';
  }

  // Update display every frame, synchronous
  refresh() {
    ;
  }

  // App is a plugin and so is the actual wallet.
  // We don't know what order hsd will load plugins
  // so we may have to wait for a few refresh cycles
  // before we can do anything wallet related
  initWallet() {
    ;
  }
}

module.exports = AbstractWidget;
