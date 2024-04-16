const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { assert } = require("chai");

describe("Proxy", function () {
  async function deployFixture() {
    const Proxy = await ethers.getContractFactory("Proxy");
    const proxy = await Proxy.deploy();

    //console.log(proxy);

    const Logic1 = await ethers.getContractFactory("Logic1");
    const logic1 = await Logic1.deploy();

    const Logic2 = await ethers.getContractFactory("Logic2");
    const logic2 = await Logic2.deploy();

    const proxyAsLogic1 = await ethers.getContractAt("Logic1", proxy);
    const proxyAsLogic2 = await ethers.getContractAt("Logic2", proxy);

    //console.log(proxyAsLogic1);

    return { proxy, logic1, logic2, proxyAsLogic1, proxyAsLogic2 };
  }

  //eth_getStorageAt
  async function lookupUint(contract, slot) {
    return parseInt(await ethers.provider.getStorage(contract, slot));
  }

  it("Should work with logic1", async function () {
    const { proxy, logic1, proxyAsLogic1 } = await loadFixture(deployFixture);

    await proxy.changeImplementation(logic1);

    assert.equal(await lookupUint(proxy, "0x0"), 0);

    await proxyAsLogic1.changeX(52);

    assert.equal(await lookupUint(proxy, "0x0"), 52);
  });

  it("Should work with upgrades", async function () {
    const { proxy, logic1, logic2, proxyAsLogic1, proxyAsLogic2 } =
      await loadFixture(deployFixture);

    await proxy.changeImplementation(logic1);

    assert.equal(await lookupUint(proxy, "0x0"), 0);

    await proxyAsLogic1.changeX(45);

    assert.equal(await lookupUint(proxy, "0x0"), 45);

    await proxy.changeImplementation(logic2);

    assert.equal(await lookupUint(proxy, "0x0"), 45);

    await proxyAsLogic2.changeX(79);

    assert.equal(await lookupUint(proxy, "0x0"), 158);

    await proxyAsLogic2.tripleX();

    assert.equal(await lookupUint(proxy, "0x0"), 158 * 3);
  });
});
