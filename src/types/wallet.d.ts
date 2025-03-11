
interface PhantomProvider {
  isPhantom?: boolean;
  solana?: {
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    publicKey?: { toString: () => string };
  };
}

interface SolflareProvider {
  isSolflare?: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  publicKey?: { toString: () => string };
}

interface BackpackProvider {
  isBackpack?: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  publicKey?: { toString: () => string };
}

interface OKXProvider {
  isOKXWallet?: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  publicKey?: { toString: () => string };
}

declare global {
  interface Window {
    phantom?: PhantomProvider;
    solflare?: SolflareProvider;
    backpack?: BackpackProvider;
    okxwallet?: OKXProvider;
  }
}

export {};
