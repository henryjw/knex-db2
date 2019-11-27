const Promise = require('bluebird')
const Client = require('knex/lib/client.js')

const Transaction = require('./transaction')

class DB2Client extends Client {
    constructor(config = {}) {
        super(config)

        // These values need to be set before calling the Client base class since it expects them to
        // have already been set for this instance. Will get errors like pool not being initialized
        // otherwise
        this.dialect = 'db2'
        this.driverName = 'odbc'

        Client.call(this, config)

        const { driver, } = (config.connection || {})

        if (!driver) {
            this.logger.warn('Warn: config.connection.driver is needed for connecting to the database')
        }
    }

    _driver() {
        return Promise.promisifyAll(require(this.driverName))
    }

    transaction() {
        return new Transaction(this, ...arguments)
    }

    wrapIdentifierImpl(value) {
        // override default wrapper ("). we don't want to use it since
        // it makes identifiers case-sensitive in DB2
        return value
    }

    printDebug(message) {
        if (process.env.DEBUG === 1) {
            this.logger.log(message)
        }
    }

    // Get a raw connection, called by the pool manager whenever a new
    // connection needs to be added to the pool.
    acquireRawConnection() {
        this.printDebug('acquiring raw connection.')
        const connectionConfig = this.config.connection
        return new Promise((resolve, reject) => {
            this.driver.connect(this._getConnectionString(connectionConfig), (err, connection) => {
                if (err) {
                    return reject(err)
                }

                return resolve(connection)
            })
        })
    }

    // Used to explicitly close a connection, called internally by the pool manager
    // when a connection times out or the pool is shutdown.
    destroyRawConnection(connection) {
        this.printDebug('destroying raw connection')

        return connection.close()
    }

    validateConnection(connection) {
        return Promise.resolve(connection.connected)
    }

    _stream(connection, obj, stream, options) {
        this._stream(
            connection,
            obj,
            stream,
            options
        )
        throw new Error('Not yet implemented')
    }

    _getConnectionString(connectionConfig = {}) {
        const connectionStringParams = (connectionConfig.connectionStringParams || {})
        const connectionStringExtension = Object.keys(connectionStringParams)
            .reduce((result, key) => {
                const value = connectionStringParams[key]
                return `${result}${key}=${value};`
            }, '')

        const connectionString = `${`DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};`
            + `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};`
            + `UID=${connectionConfig.user};PWD=${connectionConfig.password};`}${
            connectionStringExtension}`

        return connectionString
    }

    // Runs the query on the specified connection, providing the bindings
    // and any other necessary prep work.
    _query(connection, obj) {
        // TODO: verify correctness
        if (!obj || typeof obj === 'string') obj = { sql: obj, }

        const method = (obj.method !== 'raw'
            ? obj.method
            : obj.sql.split(' ')[0]).toLowerCase()

        obj.sqlMethod = method


        // Different functions are used since query() doesn't return # of rows affected,
        // which is needed for queries that modify the database
        if (method === 'select' || method === 'first' || method === 'pluck') {
            return new Promise((resolve, reject) => {
                connection.query(obj.sql, obj.bindings, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    obj.response = {
                        rows,
                        rowCount: rows.length,
                    }

                    resolve(obj);
                });
            });
        }

        return new Promise((resolve, reject) => {
            connection.createStatement((err, stmnt) => {
                if (err) {
                    reject(err);
                    return;
                }
                stmnt.prepare(obj.sql, (err2) => {
                    if (err2) {
                        reject(err2);
                        return;
                    }
                    stmnt.bind(obj.bindings, (err3) => {
                        if (err3) {
                            reject(err3);
                            return;
                        }
                        stmnt.execute((err4, rows) => {
                            if (err4) {
                                reject(err4);
                                return;
                            }
                            obj.response = {
                                rows,
                                rowCount: rows.length,
                            }
                            stmnt.close();
                            resolve(obj);
                        });
                    });
                });
            });
        });
    }

    // Process / normalize the response as returned from the query
    processResponse(obj, runner) {
        // TODO: verify correctness

        if (obj === null) return null

        const resp = obj.response
        const method = obj.sqlMethod
        const { rows, } = resp

        if (obj.output) return obj.output.call(runner, resp)

        switch (method) {
            case 'select':
            case 'pluck':
            case 'first': {
                if (method === 'pluck') return rows.map(obj.pluck)
                return method === 'first' ? rows[0] : rows
            }
            case 'insert':
            case 'del':
            case 'delete':
            case 'update':
            case 'counter':
                return resp.rowCount
            default:
                return resp
        }
    }
}

module.exports = DB2Client
