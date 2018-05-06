module.exports = {

    SPACE10: "          ",
    SPACE8: "        ",
    INVALID_ADDRESS: 0x0,
    DEFAULT_GAS_PRICE: 100000000000, // Truffle develop 默认gas_price
    DEFAULT_BALANCE: 100, // 账户默认余额（单位eth）
    CONST_WEI: 1000000000000000000,
    // DEFAULT_BALANCE: 888888, // 账户默认余额（单位eth）

    incBlockTime:(sec) => {
        var secondsToJump = sec;
        send("evm_increaseTime", [secondsToJump], function (err, result) {
            if (err) return done(err);

            // Mine a block so new time is recorded.
            send("evm_mine", function (err, result) {
                if (err) return done(err);

                web3.eth.getBlock('latest', function (err, block) {
                    if (err) return done(err)
                    var secondsJumped = block.timestamp - timestampBeforeJump

                    // Somehow it jumps an extra 18 seconds, ish, when run inside the whole
                    // test suite. It might have something to do with when the before block
                    // runs and when the test runs. Likely the last block didn't occur for
                    // awhile.
                    assert(secondsJumped >= secondsToJump)
                    done()
                })
            })
        })
    },
    compareAry: (aryA, aryB) =>  {
        if (aryA.length != aryB.length) return false;
        for (var i = 0; i < aryA.length; i++) {
            // console.log(i, aryA[i], aryB[i]);
            if (aryA[i] != aryB[i]) return false;
        }
        if(i!=aryA.length) return false;
        if(i!=aryB.length) return false;
        return true;
    },

    weiToEther: (wei) => await => {
        return wei / CONST_WEI;
    },

    beforeAll: await => {
        console.log("账户列表 beforeAll:");
        for (var seq = 0; seq < accounts.length; seq++) {
            console.log(seq + ':', accounts[seq], ": ", web3.eth.getBalance(accounts[seq]) / 1000000000000000000);
            if (seq > 1) break;
        }
    },

    afterAll: await => {
        console.log("\n\n\n账户列表 afterAll:");

        for (var seq = 0; seq < accounts.length; seq++) {
            console.log(seq + ':', accounts[seq], ": ", web3.eth.getBalance(accounts[seq]) / 1000000000000000000);
        }
    },

    unlockAllAccounts: await => {
        var PASS_CODE = "1234";
        for (var i = 0; i < web3.eth.accounts.length; i++) {
            web3.personal.unlockAccount(web3.eth.accounts[i], PASS_CODE, 0); // 不锁定
        }
    },

    // 用户自定以事件
    // callbackEvent: await => (error, result) => { // 不能使用await/async，否则将不能执行到该方法上
    callbackEvent: (error, result) => { // result: event的返回对象        
        var sp1 = "     ";
        var sp2 = "          ";
        if (!error) {
            var txsRecipt =  web3.eth.getTransactionReceipt(result.transactionHash); // 默认是sync的
            if(txsRecipt == null){
                console.log(sp1, "错误：txsRecipt is null !!!", "eventObj:", result);
                // return;
            }else{                
                console.log(sp1, "event:", result.event, "gasUsage:", txsRecipt.gasUsed);
            }
            // console.log("txsRecipt:", txsRecipt);

            
            var txs = web3.eth.getTransaction(result.transactionHash); // 默认是sync的
            if(txs==null){
                console.log(sp1, "错误：txs is null !!!", "eventObj:", result);
                // return;
            }

            // 处理args
            args = result.args;

            console.log(sp1 + "->新事件: ",
                result.event,
                " type:", result.type,
                // " args:", result.args,
                // " args-idx:", result.args.idx.toNumber(),
                // " args-key:", result.args.key,
                // " dataLen:(B)", result.args.value.length,
                // " dataLen:(KB)", (result.args.value.length / 1024).toFixed(2),
                " txIndex:", result.transactionIndex,
                " gasPrice:", (txs&&txs.gasPrice.toNumber()),
                " gas(user set):", (txs&&txs.gas),
                " gasUsage*:", (txsRecipt&&txsRecipt.gasUsed) + " " + result.event,
                " txHash:", result.transactionHash,
            );
            for (arg in args) {
                var value;
                // console.log(typeof(args[arg])); // object
                // if (typeof (args[arg]) == "Number")
                //     value = args[arg].toString();
                // else if (typeof (args[arg]) == "BigNumber")
                //     value = args[arg].toString();
                // else
                //     value = args[arg].toString();
                value = args[arg].toString();
                console.log(sp2, arg, ":", value);
            }
        } else {
            console.log("事件 error:", result);
        }
    },

    // 用户自定以事件
    // callbackEvent: await => (error, result) => { // 不能使用await/async，否则将不能执行到该方法上
    callbackEventKV: (error, result) => {
        var sp1 = "     ";
        var sp2 = "          ";
        if (!error) {
            var txs = web3.eth.getTransaction(result.transactionHash); // 默认是sync的
            // 处理args
            args = result.args;

            console.log(sp1 + "->新事件: ",
                result.event,
                " type:", result.type,
                " args:", result.args,
                " args-idx:", result.args.idx.toNumber(),
                " args-key:", result.args.key,
                " dataLen:(B)", result.args.value.length,
                " dataLen:(KB)", (result.args.value.length / 1024).toFixed(2),
                " txIndex:", result.transactionIndex,
                " gasPrice:", txs.gasPrice.toNumber(),
                " gas:", txs.gas,
                " txHash:", result.transactionHash,
            );
            // for (arg in args) {
            //     var value = "";
            //     if (typeof (args[arg]) == "Number")
            //         value = args[arg];
            //     else
            //         value = args[arg].toNumber();
            //     console.log(sp2, arg, ":", value);
            // }
        } else {
            console.log("事件 error:", result);
        }
    },
    // 系统事件filterType: pending/latest
    callbackAll: await => (error, result, filterType) => {
        var txs = web3.eth.getTransaction(result);
        if (!txs) {
            console.log(SPACE10, "getTransaction null error!.");
            return;
        }

        var receipt = web3.eth.getTransactionReceipt(result);
        // console.log(SPACE10, "receipt: 交易存根 ", receipt);
        if (!receipt) {
            console.log(SPACE10, "getTransactionReceipt null error!")
            return;
        }

        console.log(SPACE10 + "交易存根",
            " txs:", txs.hash,
            " nouce:", txs.nonce,
            " blockHash:", txs.blockHash,
            " blockNumber:", txs.blockNumber,
            " txIndex:", txs.transactionIndex,
            // " from:", txs.from, // acount0[0]
            " value:", txs.value.toNumber(),
            " gas:", txs.gas,
            " gasPrice:", txs.gasPrice.toNumber(),
            // " input:", txs.input, // 很长
            " gasUsed:(w)", (receipt.gasUsed / 10000).toFixed(2),
            " cumulativeGasUsed:", receipt.cumulativeGasUsed
        );
        // }, 3000);
    },

    getTimeStamp: await => {
        var d = new Date();
        var nowStr = d.Format("yyyy-MM-dd HH:mm:ss.S");
        return "[" + nowStr + "]";
    },

    getTimeStampMillionSec: await => {
        return Date.parse(new Date());
    },
    getTimeStampSec: await => {
        return Date.parse(new Date()) / 1000;
    },

    callbackLatest: await => (error, result) => {
        console.log(SPACE10, getTimeStamp(), "latest ", " :", result);
        // 区块hash
        // callbackAll(error, result, "latest");
    },

    callbackPending: await => (error, result) => {
        console.log(SPACE10, getTimeStamp(), "pending", " :", result);
        // 交易hash
        callbackAll(error, result, "pending");
    }
}

////
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "H+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    var year = this.getFullYear();
    var yearstr = year + '';
    yearstr = yearstr.length >= 4 ? yearstr : '0000'.substr(0, 4 - yearstr.length) + yearstr;

    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (yearstr + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


function send(method, params, callback){
    if (typeof params == "function") {
        callback = params;
        params = [];
    }
    let provider = web3.currentProvider;
    provider.send({
        jsonrpc: "2.0",
        method: method,
        params: params || [],
        id: new Date().getTime()
    }, callback);
}
