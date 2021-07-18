import { action, get, observable } from "mobx";
import { getAddress } from "ethers/lib/utils";
import { BigNumber, Contract, ethers, Signer, providers } from "ethers";
import { DAO, MiningPool__factory, Periphery } from "@workhard/protocol";
import { coingecko, weiToEth, uniV3 } from "@workhard/react-utils";

export class MineStore {
  @observable public web3: ethers.providers.Web3Provider;
  @observable public dao: DAO;
  @observable public periphery: Periphery;

  @observable public pools: string[] = [];
  @observable public apys: { [poolAddr: string]: number } = {};
  @observable public maxApys: { [poolAddr: string]: number | undefined } = {};
  @observable public distributable: boolean = false;
  @observable public visionPrice: number | undefined = 0;
  @observable public commitPrice: number | undefined = 0;
  @observable public ethPerVision: number | undefined = 0;
  @observable public visionPerLP: number = 0;
  @observable public ethPrice: number | undefined = 0;
  @observable public emission: BigNumber = BigNumber.from(0);
  @observable public emissionWeightSum: BigNumber = BigNumber.from(0);
  @observable private initialContributorPool: string | undefined;
  @observable private commitDaiUniV3Pool: Contract | undefined;

  constructor(
    _web3: ethers.providers.Web3Provider,
    _dao: DAO,
    _periphery: Periphery
  ) {
    this.web3 = _web3;
    this.dao = _dao;
    this.periphery = _periphery;
  }

  @get
  liquidityMiningIdx = () => {
    return this.pools.findIndex(
      (v) => !!v && getAddress(v) === this.periphery.liquidityMining.address
    );
  };

  @get
  commitMiningIdx = () => {
    return this.pools.findIndex(
      (v) => !!v && getAddress(v) === this.periphery.commitMining.address
    );
  };

  @get
  apy = (poolAddress: string) => {
    return this.apys[poolAddress] || NaN;
  };

  @get
  maxAPY = (poolAddress: string) => {
    return this.maxApys[poolAddress] || NaN;
  };

  @action
  init = async () => {
    this.loadPools();
    this.loadEthPrice();
  };

  @action
  loadEthPrice = async () => {
    this.ethPrice = await coingecko.getPrice(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );
  };

  @action
  loadPools = async () => {
    const poolLength =
      (await this.dao.visionEmitter.getNumberOfPools()) || BigNumber.from(0);
    const _pools = [];
    for (let i = 0; i < poolLength.toNumber(); i++) {
      _pools.push(await this.dao.visionEmitter?.pools(i));
    }
    this.pools = _pools;
    this.initialContributorPool = await this.dao.visionEmitter.initialContributorPool();
  };

  @action
  loadVisionPrice = async () => {
    if (!this.ethPrice) {
      await this.loadEthPrice();
    }
    if (!!this.ethPrice) {
      const {
        reserve0: reservedVISION,
        reserve1: reservedETH,
      } = await this.periphery.visionLP.getReserves();
      const supply = await this.periphery.visionLP.totalSupply();
      const visionPerLP = (2 * weiToEth(reservedVISION)) / weiToEth(supply);
      const ethPerVision = weiToEth(reservedETH) / weiToEth(reservedVISION);
      this.visionPerLP = visionPerLP;
      this.ethPerVision = ethPerVision;
      this.visionPrice = this.ethPrice * ethPerVision;
    }
  };

  @action
  loadCommitPrice = async () => {
    if (!this.commitDaiUniV3Pool) {
      const poolAddress = await uniV3.getPoolAddress(
        this.web3,
        this.dao.baseCurrency.address,
        this.dao.commit.address
      );
      if (poolAddress) {
        const pool = await uniV3.getPoolContract(poolAddress, this.web3);
        this.commitDaiUniV3Pool = pool;
      }
      if (this.commitDaiUniV3Pool) {
        const pool = await uniV3.getPool(this.commitDaiUniV3Pool);
        this.commitPrice = parseFloat(pool.token1Price.toFixed());
      }
    }
  };

  @action
  loadAPYs = async () => {
    if (this.pools) {
      for (let pool of this.pools) {
        if (pool === this.periphery.liquidityMining.address) {
          this.loadLiquidityMiningAPY();
        } else if (pool === this.periphery.commitMining.address) {
          this.loadCommitMiningAPY();
        } else {
          this.loadERC20StakingAPY(pool);
        }
      }
      this.loadInitialContributorSharePoolAPY();
    }
  };

  @action
  loadEmission = async () => {
    this.emission = await this.dao.visionEmitter.emission();
  };

  @action
  loadEmissionWeightSum = async () => {
    this.emissionWeightSum = (
      await this.dao.visionEmitter.emissionWeight()
    ).sum;
  };

  @action
  isDistributable = (account: Signer | providers.Provider) => {
    this.dao.visionEmitter
      .connect(account)
      .estimateGas.distribute()
      .then((_) => (this.distributable = true))
      .catch((_) => (this.distributable = false));
  };

  @action
  loadLiquidityMiningAPY = async () => {
    const totalMiners = await this.periphery.liquidityMining.totalMiners();
    const visionPerYear = (await this.periphery.liquidityMining.miningRate())
      .mul(86400 * 365)
      .div(totalMiners)
      .toNumber();
    const apy = 100 * (visionPerYear / this.visionPerLP);
    this.apys[this.periphery.liquidityMining.address] = apy;
  };

  @action
  loadCommitMiningAPY = async () => {
    const totalMiners = await this.periphery.commitMining.totalMiners();
    const visionPerYear = (await this.periphery.commitMining.miningRate())
      .mul(86400 * 365)
      .div(totalMiners)
      .toNumber();

    let commitPrice =
      this.commitPrice || (await coingecko.getPrice(this.dao.commit.address));
    commitPrice = Math.min(commitPrice || 1, 2);
    if (commitPrice) {
      const apy =
        100 *
          ((visionPerYear * (this.visionPrice || 0)) / (commitPrice || NaN)) -
        100;
      this.apys[this.periphery.commitMining.address] = apy;
      this.maxApys[this.periphery.commitMining.address] = undefined;
    } else {
      const apy = 100 * (visionPerYear * (this.visionPrice || 0)) - 100;
      this.apys[this.periphery.commitMining.address] = apy * 0.5;
      this.maxApys[this.periphery.commitMining.address] = apy;
    }
  };

  @action
  loadInitialContributorSharePoolAPY = async () => {
    if (this.initialContributorPool) {
      const initialContributorPool = MiningPool__factory.connect(
        this.initialContributorPool,
        this.web3
      );
      const totalMiners = await initialContributorPool.totalMiners();
      const visionPerYear = (await initialContributorPool.miningRate())
        .mul(86400 * 365)
        .div(totalMiners)
        .toNumber();

      const apy = 100 * (visionPerYear * (this.visionPrice || 0)) - 100;
      this.apys[this.initialContributorPool] = apy;
    }
  };

  @action
  loadERC20StakingAPY = async (poolAddress: string) => {
    const miningPool = MiningPool__factory.connect(poolAddress, this.web3);
    const totalMiners = await miningPool.totalMiners();
    const miningRate = await miningPool.miningRate();
    const visionPerYear = miningRate
      .mul(86400 * 365)
      .div(totalMiners)
      .toNumber();
    const baseToken = await miningPool.baseToken();
    const baseTokenPrice = await coingecko.getPrice(baseToken);
    const apy =
      100 *
      ((visionPerYear * (this.visionPrice || 0)) / (baseTokenPrice || NaN));
    this.apys[poolAddress] = apy;
  };

  @action
  loadERC20BurnAPY = async (poolAddress: string) => {
    const miningPool = MiningPool__factory.connect(poolAddress, this.web3);
    const totalMiners = await miningPool.totalMiners();
    const miningRate = await miningPool.miningRate();
    const visionPerYear = miningRate
      .mul(86400 * 365)
      .div(totalMiners)
      .toNumber();
    const baseToken = await miningPool.baseToken();
    const baseTokenPrice = await coingecko.getPrice(baseToken);
    const apy =
      100 *
        ((visionPerYear * (this.visionPrice || 0)) / (baseTokenPrice || NaN)) -
      100;
    this.apys[poolAddress] = apy;
  };
}
