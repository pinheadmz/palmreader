'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputH, addInputV, addButton} = require('../util');
const {HID, LedgerHSD} = require('hsd-ledger');
const {Device} = HID;

class CreateWallet extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Create Wallet (C)'
    });
    let top = 1;
    addInputH(
      this.widget,
      'Wallet name:',
      'id',
      {
        top: top
      }
    );
    this.m = addInputH(
      this.widget,
      '          M:',
      'm',
      {
        top: top += 2,
        width: 3,
        value: '1',
        resetValue: '1'
      }
    );
    this.n = addInputH(
      this.widget,
      '          N:',
      'n',
      {
        top: top += 2,
        width: 3,
        value: '1',
        resetValue: '1'
      }
    );
    addButton(
      this.widget,
      'Ledger',
      {
        top: top += 2,
        right: 1
      }
    ).on('press', async () => {
      return this.importLedger();
    });
    addInputH(
      this.widget,
      ' Passphrase:',
      'passphrase',
      {
        top: top += 6,
        censor: true
      }
    );
    addInputH(
      this.widget,
      '    Confirm:',
      'confirm',
      {
        top: top += 2,
        censor: true
      }
    );
    addInputV(
      this.widget,
      'Import seed phrase:',
      'mnemonic',
      {
        top: top+= 2,
        left: 1,
        right: 1,
        height: 8
      }
    );
    addButton(
      this.widget,
      'Create',
      {
        bottom: 0,
        right: 1
      }
    ).on('press', async () => {
      return this.createWallet();
    });
  }

  async createWallet() {
    try {
      const {
        id,
        passphrase,
        confirm,
        mnemonic,
        m,
        n
      } = this.widget.submit();

      if (!id)
        throw new Error('New wallet needs a name');

      if (confirm !== passphrase)
        throw new Error('Passphrase confirmation must match');

      await this.app.wdb.create({
        id,
        passphrase,
        mnemonic,
        m: parseInt(m),
        n: parseInt(n)
      });
      // This method clears all inputs
      this.widget.reset();
      // ...put back default values
      this.m.value = '1';
      this.n.value = '1';
      await this.app.loadWallet();
      await this.app.selectWallet(id);
      this.app.log(`Created wallet: ${id}`);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  async importLedger() {
      const {
        id,
        passphrase,
        confirm,
        mnemonic,
        m,
        n
      } = this.widget.submit();

      if (!id)
        throw new Error('New wallet needs a name');

      if (passphrase || confirm)
        throw new Error('Passphrase must be empty for Ledger');

      if (mnemonic)
        throw new Error('Seed phrase must be empty for Ledger');

    let device;
    try {
      device = await Device.requestDevice();
      const ledger = new LedgerHSD({
        device: device,
        network: this.app.wdb.network.type
      });
      await device.open();
      const pubkey = await ledger.getAccountXPUB(0);
      const accountKey = pubkey.xpubkey(this.app.wdb.network.type);

      this.app.log(`xpub from device: ${accountKey}`);

      await this.app.wdb.create({
        id,
        accountKey,
        watchOnly: true,
        m: parseInt(m),
        n: parseInt(n)
      });
      // This method clears all inputs
      this.widget.reset();
      // ...put back default values
      this.m.value = '1';
      this.n.value = '1';
      await this.app.loadWallet();
      await this.app.selectWallet(id);
      this.app.log(`Created wallet: ${id}`);
    } catch (e) {
      this.app.error(e.message);
    } finally {
      if (device)
        await device.close();
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = CreateWallet;
