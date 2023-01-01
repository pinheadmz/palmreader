/* eslint no-nested-ternary: off */
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
    this.rescan = blessed.box({
      parent: this.widget,
      label: 'Rescan all wallets',
      top: 11,
      left: 1,
      right: 1,
      height: 5,
      border: {
        type: 'line',
        fg: 'white'
      }
    });
      this.progress = blessed.text({
        parent: this.rescan,
        left: 1,
        top: 1,
        tags: true
      });
      this.rescanButton = addButton(
        this.rescan,
        'Rescan',
        {
          right: 1,
          top: 1,
          height: 1,
          padding: 0
        }
      );
      this.rescanButton.on('press', async () => {
        if (!this.app.wdb)
          return null;

        this.app.log('Rescanning...');
        return this.app.wdb.rescan(0);
      });
      this.dummyRescanButton = addButton(
        this.rescan,
        'Rescanning...',
        {
          right: 1,
          top: 1,
          height: 1,
          padding: 0,
          style: {
            bg: 'gray',
            hover: { bg: 'gray'}
          },
          hidden: true
        }
      );
    this.changepw = blessed.box({
      parent: this.widget,
      label: 'Change passphrase',
      top: 16,
      left: 1,
      right: 1,
      height: 13,
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
    this.batch = blessed.box({
      parent: this.widget,
      label: 'Send default auto-batch',
      top: 29,
      left: 1,
      right: 1,
      height: 5,
      border: {
        type: 'line',
        fg: 'white'
      }
    });
      this.batchButton = addButton(
        this.batch,
        'Send Batch',
        {
          right: 1,
          top: 1,
          height: 1,
          padding: 0
        }
      );
      this.batchButton.on('press', async () => {
        if (!this.app.wdb)
          return null;

        return this.createBatch();
      });
  }

  refresh() {
    const chainHeight = this.node.chain.height;
    const walletHeight = this.app.wdb ? this.app.wdb.height : 0;
    const prog = ((walletHeight / chainHeight || 0) * 100).toFixed(2);
    const walletString = prog < 90
                        ? `{red-fg}Wallet sync: ${prog}%{/red-fg}`
                        : prog > 99.99
                          ? `{green-fg}Wallet sync: ${prog}%{/green-fg}`
                          : `{yellow-fg}Wallet sync: ${prog}%{/yellow-fg}`;
    this.progress.content = walletString;

    if (this.app.wdb && this.app.wdb.rescanning) {
      this.rescanButton.hidden = true;
      this.dummyRescanButton.hidden = false;
    } else {
      this.rescanButton.hidden = false;
      this.dummyRescanButton.hidden = true;
    }
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

  async createBatch() {
    const wallet = this.state.getWallet();
    if (!wallet)
      return;

    try {
      const mtx = await wallet.createBatch(
        [['REVEAL'], ['FINALIZE'], ['RENEW']]
      );
      await this.app.signTX(mtx);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = Utilities;
