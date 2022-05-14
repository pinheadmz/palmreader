'use strict';

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
  }

  getWallet() {
    if (this.wallets[this.selectedWallet])
      return this.wallets[this.selectedWallet].wallet;
    else
      return null;
  }
};

module.exports = State;
