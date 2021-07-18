import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";

const POLLING_INTERVAL = 12000;
const RPC_URL =
  "https://eth-mainnet.alchemyapi.io/v2/bivBn3T5USHWOXkTyBCXTp0R9ogelinE";

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 31337],
});

export const network = new NetworkConnector({
  urls: { 1: RPC_URL },
  defaultChainId: 1,
});

export const walletconnect = new WalletConnectConnector({
  rpc: { 1: RPC_URL },
  bridge: "https://bridge.walletconnect.org",
  qrcode: true,
  pollingInterval: POLLING_INTERVAL,
});

export const walletlink = new WalletLinkConnector({
  url: RPC_URL,
  appName: "warkhard.finance",
});
