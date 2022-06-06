'use strict';

const blessed = require('blessed');
const AbstractTXModal = require('./abstract-tx');
const {addInputH, addButton} = require('../util');
const {
  HID,
  LedgerHSD
} = require('hsd-ledger');
const {Device} = HID;

class SignTransaction extends AbstractTXModal {
  constructor(options) {
    super(options);

    this.set(blessed.form, {
      label: 'Sign Transaction'
    });
    this.afterSet();

    this.passphraseInput = addInputH(
      this.widget,
      'Passphrase:',
      'passphrase',
      {
        censor: true,
        bottom: 2,
        left: 20,
        right: 20
      }
    );
    this.passphraseInput.key(['enter'], async () => {
      return this.sign();
    });
    this.button = addButton(
      this.widget,
      'Sign TX',
      {
        bottom: 1,
        right: 1
      }
    );
    this.button.on('press', async () => {
      return this.sign();
    });
  }

  async sign() {
    const mtx = this.state.mtx;
    if (!mtx) {
      this.app.error('No MTX to sign.');
      this.close();
      return;
    }

    const info = this.state.getAccountInfo();
    if (info && info.watchOnly) {
      await this.signWithLedger(mtx);
      return;
    }

    const {passphrase} = this.widget.submit();

    const wallet = this.state.getWallet();
    if (!wallet) {
      this.app.error('No wallet loaded');
      return;
    }

    try {
      await wallet.sign(mtx, passphrase);
      if (!mtx.isSigned()) {
        this.app.exportTX(mtx);
      } else {
        await wallet.sendMTX(mtx);
      }
    } catch (e) {
      this.app.error(e.message);
    } finally {
      this.reset();
      this.close();
    }
  }

  async signWithLedger(mtx) {
    let device;
    try {
      if (mtx.inputs.length > 255)
        throw new Error('Too many inputs for Ledger.');
      if (mtx.outputs.length > 255)
        throw new Error('Too many outputs for Ledger.');

      const {
        accountIndex,
        accountKey: walletXpub
      } = this.state.getAccountInfo();

      // Connect Ledger and ensure it's the right device
      device = await Device.requestDevice();
      const ledger = new LedgerHSD({
        device: device,
        network: this.app.wdb.network.type
      });
      await device.open();
      const pubkey = await ledger.getAccountXPUB(accountIndex);
      const deviceXpub = pubkey.xpubkey(this.app.wdb.network.type);
      if (walletXpub !== deviceXpub)
        throw new Error('Unexpected xpub from Ledger. (Wrong device?)');

      const signed = await ledger.signTransaction(mtx, this.ledgerOptions);

      if (!signed.isSigned()) {
        this.app.exportTX(signed);
      } else {
        // TODO: (hsd) this actually skips some important policy checks
        // see wallet.sendMTX()
        const tx = signed.toTX();
        await this.app.wdb.addTX(tx);
        await this.app.wdb.send(tx);
      }
    } catch (e) {
      this.app.error(e.message);
    } finally {
      if (device)
        await device.close();
      this.reset();
      this.close();
    }
  }

  refresh() {
    super.refresh();

    // Fetch wallet and account, set display for hot wallet or Ledger
    const info = this.state.getAccountInfo();
    if (info && info.watchOnly) {
      this.passphraseInput.hidden = true;
      this.passphraseInput.labelBox.hidden = true;
      this.button.content = 'Ledger';
    } else {
      this.passphraseInput.hidden = false;
      this.passphraseInput.labelBox.hidden = false;
      this.button.content = 'Sign TX';
      this.passphraseInput.focus();
    }
  }
}

module.exports = SignTransaction;
