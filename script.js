const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')
const moment = require('moment')
const axios = require('axios')

require('dotenv').config()

const { db } = require('./db/dbconfig')

var Client = require('coinbase').Client

// var Coinclient = new Client({ apiKey: 'API KEY', apiSecret: 'API SECRET' })

// Actions
// const { getParams } = require('./utilities')
// const { HandlePurchase, HandleSell, HandleDeposit, HandleWithdraw, SetBuyPrice, SetSellPrice, SetWithdrawalFees, SetWithdrawalMin } = require('./actions/transactions')
// const { GetBalance } = require('./actions/userdata')
// const { GetPrices, GetFees, GetMinWithdrawal, GetOwner, GetBuyCost, GetSellCost } = require('./actions/fetchdata')

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

function OffertTrade(steamID, amount, res) {
    manager.getInventoryContents(440, 2, true, (err, inventory) => {
        if (err) {
            console.log(err)
        } else {
            const TF2KEYS_INV = inventory.filter((elem) => {
                return elem.classid === '101785959'
            })

            if (amount > TF2KEYS_INV.length) {
                res.send({ trade: 'declined', msg: "Inventory can't supply\n\n. your demande is superior than the amount of keys available." })
            } else {
                let offert = null
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
                offer.send((err, status) => {
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
