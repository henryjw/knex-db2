const { expect, } = require('chai')

const Client = require('../../src/')

describe('DB2 Client', () => {
    const client = new Client({ client: 'db2', })
    it('should not wrap identifiers with delimiter', () => {
        expect(client.wrapIdentifierImpl('value')).to.equal('value')
    })

    it('can be initialized with just the client name in config', () => {
        expect(new Client({ client: 'db2', })).to.exist
    })

    describe('._getConnectionString', () => {
        it('should return expected connection string', () => {
            const connectionConfig = {
                host: 'localhost',
                database: 'knextest',
                port: 50000,
                user: 'db2inst1',
                password: 'db2inst1-pwd',
                driver: '{IBM Cli Driver}',
            }
            const expectedConnectionString = `DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};`
                + `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};`
                + `UID=${connectionConfig.user};PWD=${connectionConfig.password};`

            const connectionString = client._getConnectionString(connectionConfig)

            expect(connectionString).to.equal(expectedConnectionString)
        })

        it('should append additional connection string parameters', () => {
            const connectionConfig = {
                connectionStringParams: {
                    X: '1',
                    Y: '20',
                },
            }

            const connectionString = client._getConnectionString(connectionConfig)

            expect(connectionString.endsWith('X=1;Y=20;')).to.be.true
        })
    })
})
