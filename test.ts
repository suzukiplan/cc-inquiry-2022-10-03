/*
MIT License

Copyright (c) 2022 Yoji Suzuki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import { CoinCheck } from './CoinCheck'

(async() => {
    let cc = new CoinCheck({
        accessKey: "アクセスキー",
        secretKey: "シークレットアクセスキー"
    })
    console.log(`ticker: ${JSON.stringify(await cc.getTicker())}`)
    let balance = await cc.getBalance()
    let btcJpy = await cc.getBtcJpyRate()
    let jpy = Number(balance.jpy || 0)
    let btc = Number(balance.btc || 0)
    console.log(`balance: ¥${jpy}, ${btc}btc (¥${jpy + btc * btcJpy})`)
    console.log(`BTC/JPY Rate: 1BTC = ¥${btcJpy}, 0.005BTC = ¥${btcJpy * 0.005}`)
    console.log(`transactions: ${JSON.stringify(await cc.getTransactions())}`)
    console.log(`bankAccounts: ${JSON.stringify(await cc.getBankAccounts())}`)
    console.log(`openOrders: ${JSON.stringify(await cc.getOpenOrders())}`)
    console.log(`sendMoneyLog: ${JSON.stringify(await cc.getSendMoneyLog())}`)
    console.log(`depositMoneyLog: ${JSON.stringify(await cc.getDepositMoneyLog())}`)
})().catch((reason) => {
    console.error(`Processing was interrupted due to an error: ${JSON.stringify(reason)}`)
})
