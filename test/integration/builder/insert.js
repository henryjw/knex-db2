const Client = require('../../../src')
const knex = require('knex')({
	client: Client
})

const testSql = require('../../utils/testSql')

describe('Inserts', () => {
	it('handles insert', () => {
		const record = {
			x: 1,
			y: 2
		}
		const query = knex
			.insert(record)
			.into('testtable')

		testSql(
			query,
			'insert into testtable (x, y) values (1, 2)'
		)
	})

	it('allows identifier wrapper in query', () => {
		const query = knex
			.insert({ '"x"': 1 })
			.into('"testtable"')

		testSql(
			query,
			'insert into "testtable" ("x") values (1)'
		)
	})
})
