/* eslint-disable new-cap */
/* eslint-disable brace-style */
/* eslint-disable  max-statements-per-line */

'use strict';

const Path = require('path');
const fs = require('fs');

const blessed = require('blessed');
const State = require('./lib/state');
const {hsd} = require('./lib/util');
const {Rules, Namestate} = hsd;

const Page = require('./lib/page');

const Meta = require('./lib/widgets/meta');
const Logger = require('./lib/widgets/logger');
const History = require('./lib/widgets/history');
const NodeStatus = require('./lib/widgets/nodeStatus');
const WalletList = require('./lib/widgets/walletList');
const AccountList = require('./lib/widgets/accountList');
const AccountDetails = require('./lib/widgets/accountDetails');
const CreateAccount = require('./lib/widgets/createAccount');
const CreateWallet = require('./lib/widgets/createWallet');
const Utilities = require('./lib/widgets/utilities');
const CreateTransaction = require('./lib/widgets/createTransaction');
const ImportTransaction = require('./lib/widgets/importTransaction');
const Names = require('./lib/widgets/names');
const Actions = require('./lib/widgets/actions');

const SignTransaction = require('./lib/modals/signTransaction');
const ExportTransaction = require('./lib/modals/exportTransaction');
const InspectTransaction = require('./lib/modals/inspectTransaction');
const UpdateRecords = require('./lib/modals/updateRecords');
const RPC = require('./lib/modals/rpc');
const Help = require('./lib/modals/help');

class App {
  constructor(node) {
    this.refreshRate = 250;
    this.historyLimit = 100;

    this.node = node;
    this.walletdb = null;
    this.wdb = null;
    this.walletLoaded = false;
    this.pages = [];
    this.widgets = [];
    this.modals = [];

    this.state = new State();

    const screenOpts = {fullUnicode: true};
    if (node.config.str('palmreaderlog')) {
      screenOpts.log = node.config.str('palmreaderlog');
    }

    this.screen = blessed.screen(screenOpts);

    /*
     * PAGES
     */

    this.wide = true;
    if (this.screen.cols < 100)
      this.wide = false;

    // Pages fill the screen with widgets
    if (this.wide) {
      new Page('Dashboard', this);
      new Page('Advanced', this);
    }

    // "Carousel"
    this.currentPage = 0;

    // Title bar is special widget that lives outside a page or grid
    this.meta = new Meta({app: this});

    /*
     * WIDGETS
     */

    // Create and add widgets to the 12x12 grid on a page
    // coords = [row, col, rowSpan, colSpan]
    // PAGE 0 -- Wallet Dashboard
    this.logger = new Logger({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [0, 0, 3, 6] : [0, 0, 12, 12]
    });
    this.history = new History({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [3, 0, 4, 6] : [0, 0, 12, 12],
      focusKeys: ['s', 'S']
    });
    this.names = new Names({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [7, 0, 5, 3] : [0, 0, 12, 12],
      focusKeys: ['n', 'N']
    });
    this.actions = new Actions({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [7, 3, 5, 6] : [0, 0, 12, 12],
      focusKeys: ['x', 'X']
    });
    this.nodeStatus = new NodeStatus({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [0, 6, 2, 6] : [0, 0, 12, 12]
    });
    this.walletList = new WalletList({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [2, 6, 2, 3] : [0, 0, 12, 12],
      focusKeys: ['w', 'W']
    });
    this.accountList = new AccountList({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [2, 9, 2, 3] : [0, 0, 12, 12],
      focusKeys: ['a', 'A']
    });
    this.accountDetails = new AccountDetails({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [4, 6, 3, 6] : [0, 0, 12, 12],
      focusKeys: ['d', 'D']
    });
    this.createTransaction = new CreateTransaction({
      app: this,
      page: this.wide ? this.pages[0] : new Page('Palm Reader', this),
      coords: this.wide ? [7, 9, 5, 3] : [0, 0, 12, 12],
      focusKeys: ['t', 'T']
    });

    // PAGE 1 -- Advanced Options
    this.createAccount = new CreateAccount({
      app: this,
      page: this.wide ? this.pages[1] : new Page('Palm Reader', this),
      coords: this.wide ? [1, 3, 9, 3] : [0, 0, 12, 12],
      focusKeys: ['e', 'E']
    });
    this.createWallet = new CreateWallet({
      app: this,
      page: this.wide ? this.pages[1] : new Page('Palm Reader', this),
      coords: this.wide ? [1, 0, 9, 3] : [0, 0, 12, 12],
      focusKeys: ['c', 'C']
    });
    this.Utilities = new Utilities({
      app: this,
      page: this.wide ? this.pages[1] : new Page('Palm Reader', this),
      coords: this.wide ? [1, 9, 9, 3] : [0, 0, 12, 12],
      focusKeys: ['u', 'U']
    });
    this.importTransaction = new ImportTransaction({
      app: this,
      page: this.wide ? this.pages[1] : new Page('Palm Reader', this),
      coords: this.wide ? [1, 6, 9, 3] : [0, 0, 12, 12],
      focusKeys: ['i', 'I']
    });

    /*
     * MODALS
     */

    // Create and add modals directly to sreen
    this.signTransaction = new SignTransaction({
      app: this
    });
    this.exportTransaction = new ExportTransaction({
      app: this
    });
    this.inspectTransaction = new InspectTransaction({
      app: this
    });
    this.updateRecords = new UpdateRecords({
      app: this
    });
    this.rpc = new RPC({
      app: this,
      focusKeys: ['r', 'R']
    });
    this.help = new Help({
      app: this,
      focusKeys: ['h', 'H']
    });

    this.screen.append(this.pages[this.currentPage].box);
  }

  async open() {
    setInterval(
      async () => {
        // Keep retrying wallet on boot until it is ready
        if (!this.walletLoaded)
          await this.loadWallet();

        // Update display every frame
        this.refreshAll();
      },
      this.refreshRate
    );

    // Bind to node events
    this.node.chain.on('connect', async () => {
      // Slow down the walletDB calls while syncing or rescanning
      if (   this.node.chain.getProgress() < 0.9
          || this.wdb.rescanning) {
        if (this.wdb.height % 1000 !== 0)
          return;
      }

      await this.loadWallet();
      await this.getSelectedWalletNames();
      await this.getSelectedWalletHistory();
      await this.selectName(this.state.selectedName);
      this.refreshAll();
    });

    // Global keys
    this.screen.key(['q', 'Q', 'C-c'], async () => {
      await this.node.close();
      // Watch node close in debug log...
      await new Promise(r => setTimeout(r, 500));
      return process.exit(0);
    });
    this.screen.key(['escape'], () => {
      this.modals.forEach(modal => modal.close());
      this.screen.focused = this.screen;
    });
    this.screen.key(['[', '{'], () => {
      if (!this.isModalOpen())
        this.prevPage();
    });
    this.screen.key([']','}'], () => {
      if (!this.isModalOpen())
        this.nextPage();
    });

    this.screen.render();
  }

  refreshAll() {
    this.widgets.forEach(widget => widget.refresh());
    this.screen.render();
  }

  isModalOpen() {
    for (const modal of this.modals) {
      if (!modal.box.hidden) {
        return true;
      }
    }
    return false;
  }

  async loadWallet() {
    // Get the wallet plugin from the node, if it's loaded yet
    if (!this.node.has('walletdb'))
      return;

    // Globalize the wallet plugin if we haven't already
    if (!this.walletdb || !this.wdb) {
      this.walletdb = this.node.get('walletdb');
      this.wdb = this.walletdb.wdb;
    }

    // Load all wallet details into global state
    const wids = await this.wdb.getWallets();
    this.state.wallets = {};
    const wallets = this.state.wallets;
    for (const wid of wids) {
      const wallet = await this.wdb.get(wid);
      wallets[wid] = {};
      wallets[wid]['wallet'] = wallet;
      wallets[wid]['accounts'] = [];

      const aids = await wallet.getAccounts();
      for (const aid of aids) {
        const account = await wallet.getAccount(aid);
        const balance = await wallet.getBalance(account.accountIndex);
        wallets[wid]['accounts'][aid] = {};
        wallets[wid]['accounts'][aid]['account'] = account;
        wallets[wid]['accounts'][aid]['info']= account.getJSON(balance);
      }
    }
    this.state.walletPath = this.wdb.options.location;
    this.state.feeRate = await this.wdb.estimateFee(1);

    // Only do this stuff once
    if (!this.walletLoaded) {
      // Load primary/default
      await this.selectWallet('primary');

      // Bind to wallet events
      this.wdb.on('balance', async () => {
        // Slow down the walletDB calls while syncing or rescanning
        if (   this.node.chain.getProgress() < 0.9
            || this.wdb.rescanning) {
          if (this.wdb.height % 1000 !== 0)
            return;
        }

        try {
          await this.loadWallet();
          await this.getSelectedWalletHistory();
          await this.refreshAll();
        } catch (e) {
          this.error(e.message);
        }
      });

      // Bind events on all wallet widgets
      this.widgets.forEach(widget => widget.initWallet());

      this.walletLoaded = true;
    }
  }

  async selectWallet(wid) {
    if (this.state.selectedWallet === wid)
      return;

    this.state.selectedWallet = wid;
    // All wallets have default account
    this.state.selectedAccount = 'default';
    // Equivalent to `hsw-rpc selectwallet ...`
    const wallet = this.state.getWallet();
    if (!wallet)
      return;
    this.walletdb.rpc.wallet = wallet;

    await this.getSelectedWalletNames();
    await this.getSelectedWalletHistory();
    await this.selectName(null);
  }

  async getSelectedWalletHistory() {
    const wallet = this.state.getWallet();
    if (!wallet)
      return;
    const txs = await wallet.listHistory(
      this.state.selectedAccount,
      {
        limit: this.historyLimit,
        reverse: true
      }
    );
    const details = await wallet.toDetails(txs);
    const jsons = [];
    for (const item of details) {
      const json = item.getJSON(this.wdb.network, this.wdb.height);
      // reconnect original object for inspectTX()
      json.tx = item.tx;
      jsons.push(json);
    }

    jsons.map(async (tx) => {
      tx.balanceDelta = 0;
      tx.actions = [];
      for (const input of tx.inputs) {
        if (input.path)
          tx.balanceDelta -= input.value;
      }
      for (const output of tx.outputs) {
        if (output.path)
          tx.balanceDelta += output.value;

        const nameHash = output.covenant.items[0];

        switch(output.covenant.type) {
          case Rules.types.NONE:
            break;
          case Rules.types.CLAIM:
          case Rules.types.OPEN:
          case Rules.types.BID:
          case Rules.types.FINALIZE: {
            const name =
              Buffer.from(output.covenant.items[2], 'hex').toString('ascii');
            this.state.namesByHash.set(nameHash, name);
            tx.actions.push(
              Rules.typesByVal[output.covenant.type] + ': ' +
              name
            );
            break;
          }
          default: {
            let name = this.state.namesByHash.get(nameHash);
            // In some edge cases, the wallet won't actually know the name.
            // Examples: renewing an ANYONE-CAN-RENEW
            // Query the chain DB for this (full node only)
            if (!name) {
              const ns = await this.node.chain.db.getNameState(
                Buffer.from(nameHash, 'hex')
              );
              if (ns) {
                name = ns.name.toString('ascii');
                this.state.namesByHash.set(nameHash, name);
              }
            }
            tx.actions.push(
              Rules.typesByVal[output.covenant.type] +
              (name ? `: ${name}` : ': ?')
            );
          }
        }
      }
    });
    this.state.history = jsons;
  }

  async getSelectedWalletNames() {
    const wallet = this.state.getWallet();
    if (!wallet)
      return;
    const names = await wallet.getNames();

    let {height, network} = this.node.chain;
    height++;

    const out = [];
    for (const ns of names) {
      const json = ns.getJSON(height, network);
      this.state.namesByHash.set(json.nameHash, json.name);

      json.reserved = Rules.isReserved(ns.nameHash, height, network);
      // Note: `expired` will override the actual property from NameState,
      // but it's confusing and only has to do with claimable names...
      json.expired = ns.isExpired(height, network);

      // Slow down the walletDB calls while syncing or rescanning
      if (   this.node.chain.getProgress() < 0.9
          || this.wdb.rescanning) {
        if (this.wdb.height % 1000 !== 0) {
          out.push(json);
          continue;
        }
      }

      const {hash, index} = ns.owner;
      const coin = await wallet.getCoin(hash, index);
      json.own = Boolean(coin) && ns.isClosed(height, network);

      json.bids = await wallet.getBidsByName(ns.name);
      json.reveals = await wallet.getRevealsByName(ns.name);

      let auction = false;
      for (const reveal of json.reveals) {
        if (!reveal.own)
          continue;

        auction = true;

        // We can use the wallet's TX index to link our own bids
        // and reveals, but we can not link other users' bids and
        // reveals without the full node TX index.
        // See https://github.com/handshake-org/hsd/issues/716
        const {hash, index} = reveal.prevout;
        const {tx} = await wallet.getTX(hash);
        const input = tx.inputs[index];
        reveal.bid = input.prevout;

        // Check if reveal is spent (needs redeem / register)
        const coin = await wallet.getCoin(hash, index);
        reveal.unspent = Boolean(coin);
      }

      // If we recieve a name as a TRANSFER/FINALIZE that means the wallet
      // does not have any historical data for the name. Bids and reveals
      // might not be so important after auction is over, but REGISTERs and
      // UPDATEs might be. To ensure that we have the latest resource records
      // for a received name, we can ask the full node.
      if (json.own && !auction) {
        // We can probably use pool in SPV mode to resolve these as well,
        // but for big wallets that receive a ton of names it might be bad.
        if (!this.node.chain.options.spv) {
          const {data} = await this.node.chain.db.getNameState(ns.nameHash);
          json.data = data.toString('hex');
        }
      }

      out.push(json);
    }
    this.state.names = out;
  }

  async selectName(name) {
    this.state.selectedName = name || '';

    if (this.actions)
      this.actions.inputName.value = name || '';

    // Reset
    if (!name) {
      this.state.selectedNameState = null;
      return;
    }

    let {height, network} = this.node.chain;
    height++;

    for (const json of this.state.names) {
      if (json.name === name) {
        json.inWallet = true;
        this.state.selectedNameState = json;
        return;
      }
    }

    // Name is not in wallet, check node
    const nameHash = Rules.hashName(name);
    let ns;
    if (this.node.chain.options.spv) {
      const data = await this.node.pool.resolve(nameHash);
      if (data)
        ns = Namestate.decode(data);
    } else {
      ns = await this.node.chain.db.getNameState(nameHash);
    }

    if (ns) {
      const json = ns.getJSON(height, network);
      json.inWallet = false;
      json.reserved = Rules.isReserved(nameHash, height, network);
      json.expired = ns.isExpired(height, network);
      this.state.selectedNameState = json;
    } else {
      // Still can't find name, be opened or claimed
      this.state.selectedNameState = {
        name,
        inWallet: false,
        state: 'NONE',
        reserved: Rules.isReserved(nameHash, height, network),
        expired: false,
        stats: {}
      };
    }
  }

  log(msg) {
    if (this.meta)
      this.meta.log(msg);

    if (this.logger)
      this.logger.log(msg);
  }

  error(msg) {
    if (this.meta)
      this.meta.error(msg);

    if (this.logger)
      this.logger.error(msg);
  }

  async signTX(mtx) {
    if (!this.signTransaction)
      return;

    const wallet = this.state.getWallet();
    if (!wallet)
      return;

    // Get input coins to derive our known paths
    const view = await wallet.getCoinView(mtx);
    mtx.view = await wallet.getWalletCoinView(mtx, view);

    // hsd wallet doesn't add path details to outputs... should it?
    for (const output of mtx.outputs) {
      const {address} = output;
      output.path = await wallet.getPath(address);
    }

    this.state.mtx = mtx;
    this.signTransaction.open();
  }

  async inspectTX(mtx) {
    if (!this.inspectTransaction)
      return;

    const wallet = this.state.getWallet();
    if (!wallet)
      return;

    // Get input coins to derive our known paths
    const view = await wallet.getSpentView(mtx);
    mtx.view = await wallet.getWalletCoinView(mtx, view);

    // hsd wallet doesn't add path details to outputs... should it?
    for (const output of mtx.outputs) {
      const {address} = output;
      output.path = await wallet.getPath(address);
    }

    this.state.mtx = mtx;
    this.inspectTransaction.open();
  }

  exportTX(mtx) {
    if (!this.exportTransaction)
      return;

    this.state.hex = mtx.toHex();
    this.exportTransaction.open();
  }

  createUpdate() {
    if (!this.updateRecords)
      return;

    this.updateRecords.open();
  }

  showHelp() {
    if (!this.help)
      return;

    this.help.open();
  }

  exportFile(content, path) {
    try {
      // Remember location in state
      const words = path.split(Path.sep);
      const filename = words.pop();
      this.state.exportDir = Path.join(Path.sep, ...words);
      fs.mkdirSync(this.state.exportDir, {recursive: true});
      fs.writeFileSync(path, content);
      this.log(`Wrote file: ${filename}`);
    } catch (e) {
      this.error(`Error writing file: ${e.message}`);
    }
  }

  gotoPage(index) {
    if (index > this.pages.length - 1)
      return;

    this.pages[this.currentPage].box.detach();
    this.currentPage = index;
    this.screen.append(this.pages[this.currentPage].box);
  }

  nextPage() {
    this.pages[this.currentPage].box.detach();
    this.currentPage = (this.currentPage + 1) % this.pages.length;
    this.screen.append(this.pages[this.currentPage].box);
  }

  prevPage() {
    this.pages[this.currentPage].box.detach();
    this.currentPage = (this.currentPage + this.pages.length - 1)
                       % this.pages.length;
    this.screen.append(this.pages[this.currentPage].box);
  }
}

exports.id = 'palmreader';
exports.init = function init(node) {
  return new App(node);
};
