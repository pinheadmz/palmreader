'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputH} = require('../util');

class BackupWallet extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Backup Wallet (B)'
    });
    this.seedPhrase = blessed.text({
      parent: this.widget,
      top: 2,
      width: '75%',
      left: 'center'
    });
    addInputH(
      this.widget,
      'Enter passphrase:',
      'passphrase',
      {
        top: 0,
        right: 1,
        censor: true
      }
    ).key(['enter'], async () => {
      return this.revealSeedPhrase();
    });
  }

  async revealSeedPhrase() {
    const {passphrase} = this.widget.submit();
    this.widget.reset();

    const wallet = this.state.getWallet();
    const master = wallet.master;
    try {
      if (master.encrypted)
        await master.decrypt(passphrase);

      this.seedPhrase.content = master.mnemonic.toString();
      this.seedPhrase.content += '\n\n(press escape to clear)';
      this.seedPhrase.focus();
      this.seedPhrase.once('blur', () => {
        this.seedPhrase.content = '';
      });
      this.seedPhrase.key(['escape'], () => {
        this.seedPhrase.content = '';
      });
    } catch (e) {
      this.app.log(e.message);
    } finally {
      await master.lock();
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = BackupWallet;
