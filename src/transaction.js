const Transaction = require('knex/lib/transaction')

class TransactionDb2 extends Transaction {
    begin(conn) {
        return conn.beginTransaction()
            .then(this._resolver)
            .catch(this._rejecter)
    }

    commit(conn, value) {
        this._completed = true
        return conn.commit()
            .then(() => this._resolver(value))
            .catch(this._rejecter)
    }
}

module.exports = TransactionDb2
