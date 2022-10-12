'use strict';

const os = require('os');
const path = require('path');
const blessed = require('blessed');

class SetupWizard {
  constructor() {
    this.resolve = null;
    this.screen = blessed.screen();

    this.form = blessed.form({
      parent: this.screen,
      interactive: true,
      keys: true,
      mouse: true,
      border: {
        type: 'line',
        fg: 'red'
      }
    });

    let top = 0;
    this.title = blessed.text({
      parent: this.form,
      content:
        'Palm Reader Setup Wizard\n' +
        ' press ctrl-C to (Q)uit\n' +
        ' press [ENTER] to START\n',
      top: 0,
      left: 'center',
      width: 40,
      bold: true
    });
    top += 2;

    this.networkOption = blessed.radioset({
      parent: this.form,
      left: 2,
      top,
      shrink: true,
      content: 'Network:',
      style: {bold: true}
    });
    this.optionMain = blessed.radiobutton({
      parent: this.networkOption,
      mouse: true,
      keys: true,
      shrink: true,
      height: 1,
      left: 2,
      top: 1,
      name: 'optionMain',
      content: '(M)ain',
      checked: true
    });
    this.optionRegtest = blessed.radiobutton({
      parent: this.networkOption,
      mouse: true,
      keys: true,
      shrink: true,
      height: 1,
      left: 2,
      top: 2,
      name: 'optionRegtest',
      content: '(R)egtest'
    });
    top += 4;

    this.prefixOption = blessed.radioset({
      parent: this.form,
      left: 2,
      top,
      shrink: true,
      content: 'Data Directory:',
      style: {bold: true}
    });
    this.optionDefault = blessed.radiobutton({
      parent: this.prefixOption,
      mouse: true,
      keys: true,
      shrink: true,
      height: 1,
      left: 2,
      top: 1,
      name: 'optionDefault',
      content: '(D)efault: ' + SetupWizard.getDefault(),
      checked: true
    });
    this.optionBob = blessed.radiobutton({
      parent: this.prefixOption,
      mouse: true,
      keys: true,
      shrink: true,
      height: 1,
      left: 2,
      top: 2,
      name: 'optionBob',
      content: '(B)ob:     ' + SetupWizard.getBob()
    });
    top += 4;

    this.modeOption = blessed.radioset({
      parent: this.form,
      left: 2,
      top,
      shrink: true,
      content: 'Node Mode:',
      style: {bold: true}
    });
    this.optionFull = blessed.radiobutton({
      parent: this.modeOption,
      mouse: true,
      keys: true,
      shrink: true,
      height: 1,
      left: 2,
      top: 1,
      name: 'optionFull',
      content: '(F)ull node',
      checked: true
    });
    this.optionSPV = blessed.radiobutton({
      parent: this.modeOption,
      mouse: true,
      keys: true,
      shrink: true,
      height: 1,
      left: 2,
      top: 2,
      name: 'optionSPV',
      content: '(S)PV client'
    });
    top += 4;
  }

  async waitForOptions() {
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  resolveOptions() {
    const {
      optionMain,
      optionDefault,
      optionFull
    } = this.form.submit();

    this.resolve({
      network: optionMain ? 'main' : 'regtest',
      prefix: optionDefault ? SetupWizard.getDefault() : SetupWizard.getBob(),
      mode: optionFull,
      indexTX: optionDefault ? undefined : true,
      indexAddress: optionDefault ? undefined : true
    });
  }

  open() {
    this.bindKeys();
    this.screen.render();
  }

  close() {
    this.screen.destroy();
    console.log('✋');
  }

  bindKeys() {
    this.screen.key(['Q', 'q', 'C-c', 'escape'], async () => {
      this.close();
      return process.exit(0);
    });
    this.screen.key(['F', 'f'], async () => {
      this.optionFull.check();
      this.screen.render();
    });
    this.screen.key(['S', 's'], async () => {
      this.optionSPV.check();
      this.screen.render();
    });
    this.screen.key(['R', 'r'], async () => {
      this.optionRegtest.check();
      this.screen.render();
    });
    this.screen.key(['M', 'm'], async () => {
      this.optionMain.check();
      this.screen.render();
    });
    this.screen.key(['D', 'd'], async () => {
      this.optionDefault.check();
      this.screen.render();
    });
    this.screen.key(['B', 'b'], async () => {
      this.optionBob.check();
      this.screen.render();
    });
    this.screen.key(['enter', 'return'], async () => {
      this.resolveOptions();
    });
  }

  static getDefault() {
    return path.join(os.homedir(), '.hsd');
  }

  static getBob() {
    const home = os.homedir();
    switch (os.type()) {
      case 'Darwin':
        return path.join(home,
                        'Library',
                        'Application Support',
                        'Bob',
                        'hsd_data');
      case 'Linux':
        return path.join(home,
                        '.config',
                        'Bob',
                        'hsd_data');
      case 'Windows_NT':
        return path.join(home,
                        'Bob',
                        'hsd_data');
      default:
        throw new Error('Unrecognized OS');
    }
  }
}

module.exports = SetupWizard;
