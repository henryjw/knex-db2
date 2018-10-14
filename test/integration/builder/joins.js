const Knex = require('knex')

const Client = require('../../../src')

const knex = Knex({
    client: Client,
})

const testSql = require('../../utils/testSql')

describe('Joins', () => {
    it('handles basic join', () => {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')

        testSql(
            query,
            'select * from test inner join othertable on test.id = othertable.id',
        )
    })

    it('allows identifier wrapper in query', () => {
        const query = knex
            .select()
            .from('"test"')
            .join('"othertable"', '"test"."id"', '=', '"othertable"."id"')

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id"',
        )
    })
})
