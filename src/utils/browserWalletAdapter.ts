import { PublicKey } from "@solana/web3.js";

export class BrowserWalletAdapter {
  private walletType: string;
  private walletAdapter: any;
  
  constructor(walletType: string, walletAdapter: any) {
    this.walletType = walletType;
    this.walletAdapter = walletAdapter;
  }
  
  get publicKey(): PublicKey {
    try {
      let publicKeyStr: string;
      
      switch (this.walletType) {
        case 'phantom':
          publicKeyStr = this.walletAdapter.publicKey.toString();
          break;
        case 'solflare':
          publicKeyStr = this.walletAdapter.publicKey.toString();
          break;
        case 'backpack':
          publicKeyStr = this.walletAdapter.publicKey.toString();
          break;
        case 'okx':
          publicKeyStr = this.walletAdapter.publicKey.toString();
          break;
        default:
          throw new Error(`Unsupported wallet type: ${this.walletType}`);
      }
      
      return new PublicKey(publicKeyStr);
    } catch (error) {
      console.error('Error getting public key:', error);
      throw new Error('Failed to get public key from wallet');
    }
  }
  
  async signTransaction(transaction: any): Promise<any> {
    try {
      switch (this.walletType) {
        case 'phantom':
          return await this.walletAdapter.signTransaction(transaction);
        case 'solflare':
          return await this.walletAdapter.signTransaction(transaction);
        case 'backpack':
          return await this.walletAdapter.signTransaction(transaction);
        case 'okx':
          return await this.walletAdapter.signTransaction(transaction);
        default:
          throw new Error(`Unsupported wallet type: ${this.walletType}`);
      }
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new Error('Failed to sign transaction with wallet');
    }
  }
  
  async signAllTransactions(transactions: any[]): Promise<any[]> {
    try {
      switch (this.walletType) {
        case 'phantom':
          return await this.walletAdapter.signAllTransactions(transactions);
        case 'solflare':
          return await this.walletAdapter.signAllTransactions(transactions);
        case 'backpack':
          return await this.walletAdapter.signAllTransactions(transactions);
        case 'okx':
          return await this.walletAdapter.signAllTransactions(transactions);
        default:
          throw new Error(`Unsupported wallet type: ${this.walletType}`);
      }
    } catch (error) {
      console.error('Error signing transactions:', error);
      throw new Error('Failed to sign transactions with wallet');
    }
  }
} 