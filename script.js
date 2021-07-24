const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')

require('dotenv').config()

const { db } = require('./db/dbconfig')

const client = new SteamUser()
const community = new SteamCommunity()
const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en',
})

const logOnOptions = {
    accountName: process.env.ACCOUNT_NAME,
    password: process.env.PASSWORD,
    twoFactorCode: SteamTotp.generateAuthCode(process.env.SHARED_SECRET),
}

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies)

    community.setCookies(cookies)
    community.startConfirmationChecker(10000, process.env.IDENTITY_SECRET)
})

client.logOn(logOnOptions)

client.on('loggedOn', () => {
    console.log('HACHI STORE BOT logged in')

    client.enableTwoFactor(() => {})
    client.setPersona(SteamUser.EPersonaState.Online)
})

manager.on('newOffer', async (offer) => {
    const steamID = offer.partner.getSteamID64()
    const valid_keys = true

    let transaction = await db('sales').select('*').where({ id_supplier: steamID })
    if (transaction.length > 0) transaction = transaction[0]

    if (offer.itemsToGive.length === 0 && offer.itemsToReceive === transaction.amount) {
        offer.itemsToGive.map((item) => {
            if (item.appid !== 440 || item.classid !== '101785959') {
                valid_keys = false
            }
        })

        if (valid_keys) {
            offer.accept((err, status) => {
                if (err) {
                    console.log(err)
                } else {
                    try {
                        db.transaction(async (trx) => {
                            await db('sales')
                                .update({
                                    state: 'validated',
                                })
                                .where({ id_supplier: transaction.id_supplier, id_currency: transaction.id_currency })
                                .transacting(trx)

                            await db('balances')
                                .update({
                                    balance: balance.balance + transaction.price,
                                })
                                .where({ id_client: balance.id_client, id_currency: balance.id_currency })
                                .transacting(trx)
                        })
                    } catch (err) {
                        console.log(err)
                    }
                }
            })
        } else {
            offer.decline((err) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log('Donation declined (wanted our items).')
                }
            })
        }
    }
})

function OffertTrade(steamID, amount, res) {
    manager.getInventoryContents(440, 2, true, (err, inventory) => {
        if (err) {
            console.log(err)
        } else {
            const TF2KEYS_INV = inventory.filter((elem) => {
                return elem.classid === '101785959'
            })

            if (amount > TF2KEYS_INV.length) {
                res.send({ trade: 'declined', msg: "Inventory can't supply\n\n✹ Your demande is superior than the amount of keys available." })
            } else {
                let offer = null
                try {
                    offer = manager.createOffer(steamID)
                } catch (err) {
                    console.log(err)
                }

                const items = TF2KEYS_INV.splice(0, amount)

                items.map((elem) => {
                    offer.addMyItem(elem)
                })

                offer.setMessage(`Hachi BOT Trade. Get back your keys.`)
                offer.send(async (err, status) => {
                    if (err) {
                        console.log(err)
                        res.send({ trade: 'declined', msg: 'Hachi BOT Trade. Oups! there was an error.' })
                    } else {
                        console.log(`Sent offer. Status: ${status}.`)
                        res.send({ trade: 'accepted', msg: 'Hachi BOT Trade. I trade offer is sent.' })
                    }
                })
            }
        }
    })
}

function GetStock(res) {
    manager.getInventoryContents(440, 2, true, (err, inventory) => {
        if (err) {
            console.log(err)
        } else {
            const TF2KEYS_INV = inventory.filter((elem) => {
                return elem.classid === '101785959'
            })

            res.send({ keys: TF2KEYS_INV ? TF2KEYS_INV.length : -1 })
        }
    })
}

// API
const express = require('express')
const app = express()

app.use(express.json())
const PORT = process.env.PORT || 3002

app.get('/', (req, res) => {
    console.log('here')
})

app.post('/trade', function (req, res) {
    const { steamID, amount } = req.body

    OffertTrade(steamID, amount, res)
})

app.get('/stock', function (req, res) {
    GetStock(res)
})

app.listen(PORT, function () {
    console.log('Server listenning on port ' + PORT)
})

module.exports.client = client
