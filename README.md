[![npm version](http://img.shields.io/npm/v/knex-db2.svg)](https://npmjs.org/package/knex-db2)
[![Build Status](https://travis-ci.org/henryjw/knex-db2.svg?branch=master)](https://travis-ci.org/henryjw/knex-db2)
[![Known Vulnerabilities](https://snyk.io/test/npm/knex-db2/badge.svg)](https://snyk.io/test/npm/knex-db2)


**Disclaimer: this library is under active development. Use at your own risk.**

## Description
This is an external dialect for [knex](https://github.com/tgriesser/knex).

## Limitations
Currently this dialect has limited functionality compared to the Knex built-in dialects. Below are some of the limitations:
- No transaction support
- No streaming support
- Possibly other missing functionality

## Supported functionality
- Query building
- Query execution (see [Limitations](#Limitations))


## Installing
`npm install knex-db2`

## Dependencies
`npm install odbc` see [ODBC dependencies](#odbc-dependencies) if you run into any issues

`npm install knex`

## Usage
```javascript
const Knex = require('knex')
const Db2Dialect = require('knex-db2')

const knex = Knex({
	client: Db2Dialect,
	connection: {
		host: 'localhost',
		database: 'knextest',
		port: 50000,
		user: 'db2inst1',
		password: 'db2inst1-pwd',
		driver: '{IBM Cli Driver}',
		connectionStringParams: {
			ALLOWPROCCALLS: 1,
			CMT: 0
		}
	},
	pool: {
		min: 2,
		max: 10
	}
})

const query = knex
	.select('*')
	.from('table1')
	.where('x', 'y')


query
	.then(result => console.log(result))
	.catch(err => console.error(err))
	.finally(() => process.exit())
```


## ODBC dependencies
- make: `sudo apt install make`
- g++: `sudo apt install g++`
- unix odbc: `sudo apt-get install unixodbc unixodbc-dev`

## Configuring your driver

If you don't know the name of your installed driver, then look in look in `odbcinst.ini`. You can find the full path of the file by running `odbcinst -j`.
There you should see an entry like the one below:
```
[IBM i Access ODBC Driver 64-bit]       <= driver name enclosed in square brackets
Description=IBM i Access for Linux 64-bit ODBC Driver
Driver=/opt/ibm/iaccess/lib64/libcwbodbc.so
Setup=/opt/ibm/iaccess/lib64/libcwbodbcs.so
Threading=0
DontDLClose=1
UsageCount=1
```
If that still doesn't work, then unixodbc is probably looking for the config files in the wrong directory. A common case is that the configs are in `/etc` but your system expects them to be somewhere else. In such case, override the path unixodbc looks in via the `ODBCSYSINI` and `ODBCINI` environment variables.
E.g., `ODBCINI=/etc ODBCSYSINI=/etc`.

## Installing default driver
### Download driver
https://github.com/ibmdb/node-ibm_db#systemDetails

### Install driver
- Extract downloaded file. This will create a `clidriver` folder with the driver contents
- Copy this folder to wherever your system keeps drivers. If you're not sure where to put it, just copy it to `/opt/ibm`.
- Add the configuration your `/etc/odbcinst.ini` file. Below is what the contents of the file should look like if your odbc path is `/opt`
```
[IBM Cli Driver]
Description=IBM CLI Driver for Linux 64-bit
Driver=/opt/ibm/clidriver/lib/libdb2.soSetup=libdb2.so.1
hreading=0
DontDLClose=1
UsageCount=1
```
