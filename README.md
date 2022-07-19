# Palm Reader

## Terminal UI plugin for hsd

![palmreader-screenshot](https://raw.githubusercontent.com/pinheadmz/palmreader/master/docs/screenshot1.png)

## Download pre-built latest release & run as an application

> Coming soon!

## Prerequisites

Palm Reader (and hsd) require nodejs v16 or greater.
You must also have python and build tools installed for node-gyp to build native modules.

### Copy to clipboard

For "copy" functionality you must have `pbcopy`, `xsel` or `xclip` installed on
your system. Widgets with copy functions also have the option to export text
to a file as an alternative.

**OSX:** `brew install pbcopy`

**Linux:** `apt install xsel`

### Ledger

Ledger requires additional drivers and permissions on Linux.

**Linux:** `apt install pkg-config libusb-1.0-0-dev libudev-dev`

[Also be sure to set up udev rules for Ledger:](https://support.ledger.com/hc/en-us/articles/115005165269-Fix-USB-connection-issues-with-Ledger-Live?support=true)

```
wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash
```

## Installation

### Install globally using npm

*If you get permissions errors installing global nodejs packages,
do **not** just use `sudo`, [fix the problem instead.](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)*

`npm install -g hsd palmreader`

### Install locally using git (for contributing developers)

Clone and install as global node modules:
```
git clone https://github.com/handshake-org/hsd
cd hsd
npm i
npm i -g
cd ..
git clone https://github.com/pinheadmz/palmreader
cd palmreader
npm i --prod
npm i -g
```

**The `--prod` flag is important here!**

## Usage

With hsd and Palm Reader both installed as global nodejs packages, run:

`hsd --plugins palmreader`

Notice that hsd is still the main process and Palm Reader is added as a plug-in.
This means your hsd node remains [fully configurable](https://hsd-dev.org/guides/config.html),
and ALL configurations "should be" compatible with Palm Reader.

Examples:

```
hsd --plugins palmreader --spv --no-dns --api-key sandwich
hsd --plugins palmreader --network regtest --index-tx --index-address --prefix ~/.config/Bob/hsd_data
hsd --plugins palmreader --log-level spam
```

## Build executable

We use [pkg](https://github.com/vercel/pkg) to create an executable that bundles
nodejs itself along with hsd and Palm Reader scripts.

This time, remove the `--prod` flag after cloning from git:

```
cd palmreader
npm i
npm run build
```

Executable will be compiled to the `build/` directory.

## Dependencies

Due to the sensitivity of cryptocurrency software to dependency risk, only
software written by The Handshake Developers is required by Palm Reader.

Any exceptions to this will be vendored and indicated below:

https://github.com/yaronn/blessed-contrib has been stripped down and included
in `src/` along with snippets from https://github.com/chalk/strip-ansi and
https://github.com/chalk/ansi-regex (all MIT License)