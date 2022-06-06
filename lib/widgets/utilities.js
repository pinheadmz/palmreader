'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputH, addButton} = require('../util');

class Utilities extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Wallet Utilities (U)'
    });
    this.backup = blessed.box({
      parent: this.widget,
      label: 'Reveal seed phrase',
      top: 1,
      left: 1,
      right: 1,
      height: 10,
      border: {
        type: 'line',
        fg: 'white'
      }
    });
      this.seedPhrase = blessed.text({
        parent: this.backup,
        top: 2,
        width: '75%',
        left: 'center'
      });
      addInputH(
        this.backup,
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
    this.changepw = blessed.box({
      parent: this.widget,
      label: 'Change passphrase',
      top: 12,
      left: 1,
      right: 1,
      bottom: 0,
      border: {
        type: 'line',
        fg: 'white'
      }
    });
      addInputH(
        this.changepw,
        'Current:',
        'old',
        {
          top: 1,
          right: 1,
          censor: true
        }
      );
      addInputH(
        this.changepw,
        '    New:',
        'newpw',
        {
          top: 3,
          right: 1,
          censor: true
        }
      );
      addInputH(
        this.changepw,
        'Confirm:',
        'confirm',
        {
          top: 5,
          right: 1,
          censor: true
        }
      );
      addButton(
        this.changepw,
        'Update',
        {
          right: 1,
          bottom: 1
        }
      ).on('press', async () => {
        return this.changePassphrase();
      });
  }

  async revealSeedPhrase() {
    const {passphrase} = this.widget.submit();
    this.widget.reset();

    const wallet = this.state.getWallet();
    if (!wallet)
      return;
    const master = wallet.master;
    try {
      const info = this.state.getAccountInfo();
      if (info && info.watchOnly)
        throw new Error ('No seed phrase available for Ledger');

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
      this.app.error(e.message);
    } finally {
      await master.lock();
    }
  }

  async changePassphrase() {
    try {
      const {old, newpw, confirm} = this.widget.submit();

      if (newpw !== confirm)
        throw new Error('Passphrase confirmation must match');

      const wallet = this.state.getWallet();
      if (!wallet)
        return;

      await wallet.setPassphrase(newpw, old ? old : null);

      this.app.log('Passphrase change successful');
      this.widget.reset();
    } catch (e) {
      this.app.error(e.message);
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = Utilities;
