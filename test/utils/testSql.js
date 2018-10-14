const { expect } = require('chai')

module.exports = (query, expectedSql, expectedBindings) => {
    expect(query.toString()).to.equal(expectedSql)

    if (expectedBindings) {
        expect(query.toSQL().sql.bindings).to.deep.equal(expectedBindings)
    }
}
