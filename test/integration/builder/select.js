const Knex = require('knex')

const Client = require('../../../src')

const knex = Knex({
    client: Client,
})

const testSql = require('../../utils/testSql')

describe('Select', () => {
    it('handles select', () => {
        const query = knex
            .select([
                'x',
                'y',
            ])
            .from('test')
            .where('x', 1)

        testSql(
            query,
            'select x, y from test where x = 1'
        )
    })

    it('allows identifier wrapper in query', () => {
        const query = knex
            .select([
                '"x"',
                '"y"',
            ])
            .from('"test"')
            .where('"x"', 1)

        testSql(
            query,
            'select "x", "y" from "test" where "x" = 1'
        )
    })
})
