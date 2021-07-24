const { db } = require('./db/dbconfig')
const fs = require('fs')

module.exports = {
    getParams: function getParams(message) {
        return message.split(' ')
    },
    // currencies: ['BTC', 'ETH', 'DOGE', 'ADA', 'DOT'],
    // currencies: ['BTC', 'ETH', 'DOGE'],
    GetCurrencies: () => db('currencies').select('code'),
    SetConfigFile: (value, change) => {
        const file_content = fs.readFileSync('./config.json')
        const content = JSON.parse(file_content)

        switch (change) {
            case 'KEY_PRICE_BUY':
                content.KEY_PRICE_BUY = value
                break
            case 'KEY_PRICE_SELL':
                content.KEY_PRICE_SELL = value
                break
            case 'WITHDRAWAL_FEES':
                content.WITHDRAWAL_FEES = value
                break
            case 'WITHDRAWAL_MIN':
                content.WITHDRAWAL_MIN = value
                break
        }

        fs.writeFileSync('./config.json', JSON.stringify(content))
    },
    GetConfigValues: () => {
        const file_content = fs.readFileSync('./config.json')
        const content = JSON.parse(file_content)

        return content
    },

    price: 2.5,
    constants: {
        // regex
        username_rg: /^[A-Za-z]+[A-Za-z0-9 ]*$/,
        alph_rg: /^[A-Za-zéàè]+[A-Za-zéàè]*$/,
        alphanum_rg: /^[A-Za-zéàè0-9 ]+[A-Za-zéàè0-9 ]*$/,
        email_rg: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\., ;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        num_rg: /^[0-9]+[0-9]*$/,
        float_rg: /^[0-9]+[.]?[0-9]*$/,
        neg_num_rg: /^(-)?[0-9]+[0-9]*$/,
    },
}
