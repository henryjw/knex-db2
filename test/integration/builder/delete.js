const Knex = require('knex')

const Client = require('../../../src')
const testSql = require('../../utils/testSql')

const knex = Knex({
    client: Client,
})

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
