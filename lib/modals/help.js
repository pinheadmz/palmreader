'use strict';

const blessed = require('blessed');
const AbstractModal = require('./abstract');

class Help extends AbstractModal {
  constructor(options) {
    super(options);

    this.set(blessed.form, {
      label: 'Help (H)'
    });
    this.helpDisplay = blessed.text({
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
      style: {
        bold: true,
        fg: 'green'
      }
   });
  }

  refresh() {
    // TODO: add actual usage guide in each widget and aggregate here.
    this.helpDisplay.content = 'Widgets:\n';
    for (const widget of this.app.widgets) {
      const title = widget.widget.options.label;
      if (title) {
        const [label, key] = title.split('(');
        this.helpDisplay.content += '  ';
        this.helpDisplay.content += key ? key[0] + ': ' : '   ';
        this.helpDisplay.content += label + '\n';
      }
    }

    this.helpDisplay.content += '\nModals:\n';
    for (const modal of this.app.modals) {
      const title = modal.widget.options.label;
      if (title) {
        const [label, key] = title.split('(');
        this.helpDisplay.content += '  ';
        this.helpDisplay.content += key ? key[0] + ': ' : '   ';
        this.helpDisplay.content += label + '\n';
      }
    }

    this.helpDisplay.content += '\nGlobal keys:\n'+
                                 '  Esc: return to dashboard\n' +
                                 '  [: last page\n' +
                                 '  ]: next page\n' +
                                 '  Q:      Quit\n' +
                                 '  Ctrl-C: Quit\n';
  }
}

module.exports = Help;
