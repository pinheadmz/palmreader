# Palm Reader

## Terminal UI plugin for hsd

![palmreader-screenshot](https://raw.githubusercontent.com/pinheadmz/palmreader/master/docs/screenshot1.png)

## Download pre-built latest release & run as an application

> Coming soon!

## Usage

**See the [wiki](https://github.com/pinheadmz/palmreader/wiki/1.-Introduction)
for more information**

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

## Install and run (easiest)

This command will download and install Palm Reader (bundled with hsd) and run
the [`Setup Wizard`](https://github.com/pinheadmz/palmreader/wiki/2.-Setup-Wizard-and-configuration)
right away. The code only needs to be downloaded once, after
that the same command will run the application.

```
npm exec palmreader
```

Options can be passed
[using this syntax](https://github.com/pinheadmz/palmreader/wiki/2.-Setup-Wizard-and-configuration#bypass-wizard-with-command-line-flags)
to bypass the setup wizard:

```
# Skip setup wizard, run hsd full node with default configuration
npm exec palmreader -- -f
```

## Developer installation

Clone and install:
```
git clone https://github.com/pinheadmz/palmreader
cd palmreader
npm i --prod
```

**The `--prod` flag is important here!**

### Self-contained app (easiest)

`./bin/palmreader`

This will launch the
[`Setup Wizard`](https://github.com/pinheadmz/palmreader/wiki/2.-Setup-Wizard-and-configuration),
a terminal UI with the most common hsd
options. Hit `enter` to launch the node and wallet with selected options.

Options can be passed
[using this syntax](https://github.com/pinheadmz/palmreader/wiki/2.-Setup-Wizard-and-configuration#bypass-wizard-with-command-line-flags)
to bypass the setup wizard. For example, to start Palm Reader in regtest mode
with a full node, saving data to the default hsd location:

```
./bin/palmreader -rfd
```

...or to a custom location:

```
./bin/palmreader -o ~/Desktop/test
```

...or with additional parameters for hsd:

```
./bin/palmreader -o ~/Desktop/test --index-tx
```


### As hsd plug-in (advanced)

`/path/to/hsd --plugins /path/to/palmreader`

Notice that in this configuration hsd is still the main process and Palm Reader
is added as a plug-in. This means your hsd node remains
[fully configurable](https://hsd-dev.org/guides/config.html),
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