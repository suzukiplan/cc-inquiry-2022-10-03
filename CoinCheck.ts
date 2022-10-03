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
import * as crypto from 'crypto'
let request = require('request');

/**
 * 相場情報（簡易版）
 */
 class Ticker {
    last?: number // 最後の取引価格
    bid?: number  // 現在の買い注文の最高価格
    ask?: number // 現在の売り注文の最安価格
    high?: number // 24時間での最高取引価格
    low?: number //  24時間での最安取引価格
    volume?: number // 24時間での取引量
    timestamp?: number // 現在の時刻
}

/**
 * 残高
 */
class Balance {
    success?: boolean // 成功フラグ
    jpy?: number // 日本円の残高
    btc?: number // ビットコインの残高
    jpy_reserved?: number // 未決済の買い注文に利用している日本円の合計
    btc_reserved?: number // 未決済の売り注文に利用しているビットコインの合計
    jpy_lend_in_use?: number // 貸出申請をしている日本円の合計（現在は日本円貸出の機能を提供していません）
    btc_lend_in_use?: number // 貸出申請をしているビットコインの合計（現在はビットコイン貸出の機能を提供していません）
    jpy_lent?: number // 貸出をしている日本円の合計（現在は日本円貸出の機能を提供していません）
    btc_lent?: number // 貸出をしているビットコインの合計（現在はビットコイン貸出の機能を提供していません）
    jpy_debt?: number // 借りている日本円の合計
    btc_debt?: number // 借りている日本円の合計
}

/**
 * 注文結果
 */
class OrderResponse {
    success?: boolean // 成功フラグ
    id?: number // 新規注文のID
    rate?: number // 注文のレート
    amount?: number // 注文の量
    order_type?: string // 注文方法 "buy", "sell"
    stop_loss_rate?: number // 逆指値レート
    pair?: string // 取引ぺア "btc_jpy"
    created_at?: string // 注文の作成日時
}

/**
 * 送金データ
 */
class SendMoneyData {
    id?: number // 送金ID
    currency?: string // 送金通貨 (BTC)
    amount?: number // 送ったbitcoinの量
    fee?: number // 手数料
    address?: string // 送金先アドレス
    created_at?: string // 送金日時
}

/**
 * 送金履歴
 */
class SendMoneyLog {
    success?: boolean // 成功フラグ
    sends?: Array<SendMoneyData> // 送金データ
}

/**
 * 受け取りデータ
 */
 class DepositMoneyData {
    id?: number // 受け取りID
    currency?: string // 通貨 (BTC)
    amount?: number // 数量
    address?: string // 受け取り元アドレス
    status?: number // ステータス
    confirmed_at?: string // 承認日時
    created_at?: string // 処理日時
}

/**
 * 受け取り履歴
 */
 class DepositMoneyLog {
    success?: boolean // 成功フラグ
    deposits?: Array<DepositMoneyData> // 受け取りデータ
}

/**
 * 各残高の増減分
 */
class Funds {
    btc?: number
    jpy?: number
}

/**
 * 注文履歴
 */
class Transaction {
    id?: number // トランザクションID
    order_id?: number // 注文のID
    created_at?: string // 取引が行われた時間
    funds?: Funds // 各残高の増減分
    pair?: string // 取引ペア
    rate?: number // 約定価格
    fee_currency?: string // 手数料の通貨
    fee?: number // 発生した手数料
    liquidity?: string // "T" ( Taker ) or "M" ( Maker )
    side?: string // "sell" or "buy"
}

/**
 * 出金用に登録された銀行口座の一覧を取得
 */
class BankAccount {
    id?: number // ID
    bank_name?: string // 銀行名
    branch_name?: string // 支店名
    bank_account_type?: string // 銀行口座の種類（futsu : 普通口座, toza : 当座預金口座）
    number?: number // 口座番号
    name?: string // 名義
}

/**
 * 未決済の注文
 */
class OpenOrder {
    id?: number // 注文のID（OrderResponse::idと同一です）
    rate?: number // 注文のレート（ null の場合は成り行き注文です）
    pending_amount?: number // 注文の未決済の量
    pending_market_buy_amount?: number // 注文の未決済の量（現物成行買いの場合のみ）
    order_type?: string // 注文のタイプ（"sell" or "buy"）
    stop_loss_rate?: number // 逆指値レート
    pair?: string // 取引ペア
    created_at?: string // 注文の作成日時
}

/**
 * 未決済の注文一覧取得レスポンス
 */
class OpenOrdersResponse {
    success?: boolean // 成功フラグ
    orders?: Array<OpenOrder> // 未決済の注文一覧
}

/**
 * 受取人情報のオブジェクト
 */
class BeneficiaryAttrs {
    vasp_type?: string // 送金先サービス名
    vasp_name?: string // 送金先サービス名 ※vasp_type が extra_vasp の場合必須入力
    kana_name?: string // 法人名（カナ）※beneficiary_kind が legal の場合必須入力
    kana_first_name?: string // 名（カナ）※beneficiary_kind が natural の場合必須入力
    kana_last_name?: string // 姓（カナ）※beneficiary_kind が natural の場合必須入力
}

/**
 * 送金パラメタ
 */
class SendMoneyParams {
    address?: string // 送り先のビットコインアドレス
    amount?: number // 送りたいビットコインの量
    beneficiary_kind?: string // 受取人の種別（self, natural, legal）
    beneficiary_attrs?: BeneficiaryAttrs // 受取人情報のオブジェクト
}

/**
 * エラー情報
 */
class CoinCheckError {
    error?: Error // エラー情報
    statusCode?: number // HTTP ステータスコード
    message?: string // CoinCheck サーバメッセージ

    constructor(error?: Error, statusCode?: number, message?: string) {
        this.error = error
        this.statusCode = statusCode
        this.message = message
    }
}

/**
 * コンストラクタ引数
 */
class ConstructorParams {
    accessKey?: string
    secretKey?: string
}

/**
 * CoinCheck API for Node.js
 */
class CoinCheck {
    private originUrl: string
    private accessKey: string
    private secretKey: string

    constructor(params: ConstructorParams) {
        this.originUrl = 'https://coincheck.com/api'
        this.accessKey = params.accessKey || ""
        this.secretKey = params.secretKey || ""
    }

    private apiRequest(path: string, method = 'GET', json?: any): Promise<any> {
        let _this = this
        return new Promise(function(resolve, reject) {
            let accessNonce = new Date().getTime()
            var signature = `${accessNonce}${_this.originUrl}${path}`
            if (json) signature += JSON.stringify(json)
            let accessSignature = crypto.createHmac('sha256', _this.secretKey).update(signature).digest('hex')
            let options = {
                url: `${_this.originUrl}${path}`,
                method: method,
                headers: {
                    'ACCESS-KEY': _this.accessKey,
                    'ACCESS-NONCE': accessNonce,
                    'ACCESS-SIGNATURE': accessSignature,
                    'Content-type': 'application/json',
                },
                json: json,
                data: undefined,
            }
            console.log(`[${method}] ${options.url}`)
            request(options, (error: any, response: { statusCode: number }, body: any) => {
                if(!error && response.statusCode == 200) {
                    if (method == 'GET') {
                        resolve(JSON.parse(body))
                    } else {
                        resolve(body)
                    }
                } else {
                    console.error(body)
                    reject(new CoinCheckError(error, response.statusCode, body ? body.error : undefined))
                }
            })
        })
    }
    /**
     * 相場情報（簡易版）
     * @returns 相場情報（簡易版）
     */
    getTicker(): Promise<Ticker> { return this.apiRequest('/ticker') }

    /**
     * 残高を取得
     * @returns 残高（Balance）
     */
    getBalance(): Promise<Balance> { return this.apiRequest('/accounts/balance') }

    /**
     * 最近の取引履歴を取得
     * @returns 履歴（Array<Transaction>）
     */
    async getTransactions() {
        let result = await this.apiRequest('/exchange/orders/transactions')
        return result.transactions as Array<Transaction>
    }

    /**
     * 銀行口座一覧を取得
     * @returns 履歴（Array<BankAccount>）
     */
     async getBankAccounts() {
        let result = await this.apiRequest('/bank_accounts')
        return result.data as Array<BankAccount>
    }

    /**
     * BTC/JPYのレート取得
     * @returns BTC/JPYのレート
     */
    async getBtcJpyRate() {
        let result = await this.apiRequest('/rate/btc_jpy')
        return result.rate as number
    }

    /**
     ビットコインを成行買い
     * @param jpy 購入価格（日本円）
     * @returns 注文結果（OrderResponse）
     */
    buyBTC(jpy: number): Promise<OrderResponse> {
        return this.apiRequest('/exchange/orders', 'POST', {
            pair: 'btc_jpy',
            order_type: 'market_buy',
            market_buy_amount: jpy
        })
    }

    /**
     * 未決済の注文一覧
     * @returns 未決済の注文一覧（OpenOrdersResponse）
     */
    getOpenOrders(): Promise<OpenOrdersResponse> { return this.apiRequest('/exchange/orders/opens') }

    /**
     * 自然人のコインチェック口座へビットコインを送金
     * @param address 送金アドレス
     * @param amount 送金額（ビットコイン）
     * @param firstName 送金先の名前（カナ）
     * @param lastName 送金先の名字（カナ）
     */
    sendBTC(address: string, amount: number, firstName: string, lastName: string): Promise<SendMoneyData> {
        let params = new SendMoneyParams()
        params.address = address
        params.amount = amount
        params.beneficiary_kind = "natural"
        params.beneficiary_attrs = new BeneficiaryAttrs()
        params.beneficiary_attrs.vasp_type = "coincheck"
        params.beneficiary_attrs.kana_first_name = firstName
        params.beneficiary_attrs.kana_last_name = lastName
        console.dir(params)
        return this.apiRequest('/send_money', 'POST', params)
    }

    /**
     * 送金ログを取得
     */
     getSendMoneyLog(): Promise<SendMoneyLog> { return this.apiRequest('/send_money', 'GET', {currency: "BTC"}) }

    /**
     * 受け取りログを取得
     */
     getDepositMoneyLog(): Promise<DepositMoneyLog> { return this.apiRequest('/deposit_money', 'GET', {currency: "BTC"}) }
}

export { CoinCheck, CoinCheckError }
