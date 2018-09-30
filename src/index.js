const Promise = require('bluebird')
const Client = require('knex/lib/client.js')

const Transaction = require('./transaction')

class DB2Client extends Client {
	constructor(config = {}) {
		super(config)

		// These values need to be set before calling the Client base class since it expects them
		// to have already been set for this instance. Will get errors like pool not being initialized otherwise
		this.dialect = 'db2'
		this.driverName = 'odbc'

		Client.call(this, config)

		const driver = (config.connection || {}).driver

		if (!driver) {
			this.logger.warn('Warn: config.connection.driver is needed for connecting to the database')
		}
	}

	_driver() {
		return Promise.promisifyAll(require('odbc'))
	}

	transaction() {
		return new Transaction(this, ...arguments)
	}

	wrapIdentifierImpl(value) {
		// override default wrapper ("). we don't want to use it since it makes identifiers case-sensitive in DB2
		return value
	}

	// Get a raw connection, called by the pool manager whenever a new
	// connection needs to be added to the pool.
	acquireRawConnection() {
		this.logger.debug('acquiring raw connection.')
		const connectionConfig = this.config.connection
		return new Promise((resolve, reject) => {
			this.driver.open(this._getConnectionString(connectionConfig), (err, connection) => {
				if (err) {
					return reject(err)
				}

				resolve(connection)
			})
		})
	}

	// Used to explicitly close a connection, called internally by the pool manager
	// when a connection times out or the pool is shutdown.
	destroyRawConnection(connection) {
		this.logger.debug('destroying raw connection')

		return connection.closeAsync()
	}

	validateConnection(connection) {
		const isConnected = connection.connected == true
			? true
			: false

		return Promise.resolve(isConnected)
	}

	_stream(connection, obj, stream, options) {
		throw new Error('Not yet implemented')
	}

	_getConnectionString(connectionConfig = {}) {
		const connectionStringParams = (connectionConfig.connectionStringParams || {})
		const connectionStringExtension = Object.keys(connectionStringParams).reduce((result, key) => {
			const value = connectionStringParams[key]
			return result + `${key}=${value};`
		}, '')

		const connectionString = `DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};`
			+ `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};`
			+ `UID=${connectionConfig.user};PWD=${connectionConfig.password};`
			+ connectionStringExtension

		return connectionString
	}

	// Runs the query on the specified connection, providing the bindings
	// and any other necessary prep work.
	_query(connection, obj) {
		// TODO: verify correctness
		if (!obj || typeof obj === 'string') obj = { sql: obj }

		const method = obj.method || obj.sql.split(' ')[0]
		if (method === 'select' || method === 'first' || method === 'pluck') {
			return connection.queryAsync(obj.sql, obj.bindings)
				.then(function formatResponse(rows) {
					obj.response = {
						rows,
						rowCount: rows.length
					}

					return obj
				})
		}

		return connection.prepareAsync(obj.sql)
			.then(statement => statement.executeNonQueryAsync(obj.bindings))
			.then(function formatResponse(numRowsAffected) {
				obj.response = {
					rowCount: numRowsAffected
				}

				return obj
			})
	}

	// Process / normalize the response as returned from the query
	processResponse(obj, runner) {
		// TODO: verify correctness

		if (obj === null) return

		const resp = obj.response
		const method = obj.method
		const rows = resp.rows

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
			case 'update':
			case 'counter':
				return resp.rowCount
			default:
				return resp
		}
	}
}

module.exports = DB2Client
