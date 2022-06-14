'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

class State {
  constructor() {
    // From WalletDB on loadWallet()
    this.wallets = {};
    this.walletPath = '';
    this.feeRate = 0;
    // From WalletDB on getSelectedWalletNames()
    this.names = [];
    // From WalletDB on getSelectedWalletHistory()
    this.history = [];
    // For namehash preimage lookups, fed by all wallets
    this.namesByHash = new Map();
    // Selected by user
    this.selectedWallet = '';
    this.selectedAccount = '';
    this.selectedName = '';
    this.selectedNameState = null;
    // For TX signing and exporting hex
    this.mtx = null;
    this.hex = null;
    this.mtxFile = '';
    // Default export file location is user's homedir or desktop if available.
    // This can be changed by user and is "remembered" for next export.
    this.exportDir = os.homedir();
    const desktop = path.join(os.homedir(), 'Desktop');
    if (fs.existsSync(desktop))
      this.exportDir = desktop;
  }

  getWallet() {
    if (this.wallets[this.selectedWallet])
      return this.wallets[this.selectedWallet].wallet;
    else
      return null;
  }

  getAccountInfo() {
    if (   this.wallets[this.selectedWallet]
        && this.selectedAccount
        && this.wallets[this.selectedWallet].accounts[this.selectedAccount]) {
      return this.wallets[this.selectedWallet]
                 .accounts[this.selectedAccount]
                 .info;
    } else {
      return null;
    }
  }
};

module.exports = State;
