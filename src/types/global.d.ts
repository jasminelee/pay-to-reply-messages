
interface Window {
  // Phantom wallet
  phantom?: {
    solana?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
    };
  };
  
  // Solflare wallet
  solflare?: {
    connect: () => Promise<{ publicKey: string }>;
    disconnect: () => Promise<void>;
  };
  
  // Backpack wallet
  backpack?: {
    connect: () => Promise<{ publicKey: string }>;
    disconnect: () => Promise<void>;
  };
  
  // OKX wallet
  okxwallet?: {
    solana?: {
      connect: () => Promise<{ publicKey: string }>;
      disconnect: () => Promise<void>;
    };
  };
}
