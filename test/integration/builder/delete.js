const Client = require('../../../src')
const knex = require('knex')({
	client: Client
})

const testSql = require('../../utils/testSql')

describe('Delete', () => {
	it('handles delete', () => {
		const query = knex
			.delete()
			.from('test')
			.where('x', 'y')

		testSql(
			query,
			'delete from test where x = \'y\''
		)
	})

	it('allows identifier wrapper in query', () => {
		const query = knex
			.delete()
			.from('"test"')

		testSql(
			query,
			'delete from "test"'
		)
	})
})
