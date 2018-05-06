var BecToken = artifacts.require("./BecToken.sol");

module.exports = function(deployer) {
  deployer.deploy(BecToken); // 初始化参数
};
