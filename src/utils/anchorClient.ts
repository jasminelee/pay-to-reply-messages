import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction, VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import { saveMessage, updateMessageStatus } from './messageService';

// AnchorWallet interface definition updated to match Anchor's Wallet type
export interface AnchorWallet {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
}

// Get the IDL from the project directory 
const IDL: Idl = {
  version: "0.1.0",
  name: "pay_to_reply",
  instructions: [
    {
      name: "createMessagePayment",
      accounts: [
        {
          name: "sender",
          isMut: true,
          isSigner: true
        },
        {
          name: "recipient",
          isMut: false,
          isSigner: false
        },
        {
          name: "messageEscrow",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        },
        {
          name: "messageId",
          type: "string"
        }
      ]
    },
    {
      name: "approveMessagePayment",
      accounts: [
        {
          name: "sender",
          isMut: false,
          isSigner: false
        },
        {
          name: "recipient",
          isMut: true,
          isSigner: true
        },
        {
          name: "messageEscrow",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "rejectMessagePayment",
      accounts: [
        {
          name: "sender",
          isMut: true,
          isSigner: false
        },
        {
          name: "recipient",
          isMut: false,
          isSigner: true
        },
        {
          name: "messageEscrow",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "MessageEscrow",
      type: {
        kind: "struct",
        fields: [
          {
            name: "sender",
            type: "publicKey"
          },
          {
            name: "recipient",
            type: "publicKey"
          },
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "messageId",
            type: "string"
          },
          {
            name: "status",
            type: {
              defined: "EscrowStatus"
            }
          },
          {
            name: "createdAt",
            type: "i64"
          },
          {
            name: "processedAt",
            type: "i64"
          }
        ]
      }
    }
  ],
  types: [
    {
      name: "EscrowStatus",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Pending"
          },
          {
            name: "Approved"
          },
          {
            name: "Rejected"
          }
        ]
      }
    }
  ],
  errors: []
};

// Constants
const PROGRAM_ID = new PublicKey("GPS2swU3p4XGWisAh3n4QWQuMvrQdfnz2eSwME2dp66A");

// Types
export interface MessageEscrow {
  sender: PublicKey;
  recipient: PublicKey;
  amount: anchor.BN;
  messageId: string;
  status: EscrowStatus;
  createdAt: anchor.BN;
  processedAt: anchor.BN;
}

export enum EscrowStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

// Helper function to get the provider
const getProvider = (wallet: AnchorWallet): anchor.AnchorProvider => {
  // Use Sonic DevNet instead of Solana Devnet to match the connection in WalletContext
  const connection = new anchor.web3.Connection(
    "https://api.testnet.sonic.game", "confirmed"
  );
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  return provider;
};

// Helper function to get the program
export const getProgram = async (wallet: AnchorWallet): Promise<anchor.Program<typeof IDL>> => {
  const provider = getProvider(wallet);
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);
  return program;
};

// Derive PDA for message escrow
export const deriveMessageEscrowPDA = async (
    sender: PublicKey,
    recipient: PublicKey,
    messageId: string,
    program: Program<typeof IDL>
): Promise<[PublicKey, number]> => {
    // The Anchor program uses only two seeds:
    // 1. The string "msg" as a prefix
    // 2. The first 4 bytes of the message ID
    return await PublicKey.findProgramAddress(
        [
            Buffer.from("msg"),
            Buffer.from(messageId.slice(0, 4))
        ],
        program.programId
    );
};

// Helper function to check if wallet has sufficient balance
const checkSufficientBalance = async (
  wallet: AnchorWallet,
  requiredAmount: number
): Promise<boolean> => {
  try {
    const provider = getProvider(wallet);
    const connection = provider.connection;
    const walletBalance = await connection.getBalance(wallet.publicKey);
    
    // Convert SOL amount to lamports for comparison
    const requiredLamports = requiredAmount * LAMPORTS_PER_SOL;
    
    // Add estimated fee and rent for the transaction (0.01 SOL as buffer)
    const estimatedFee = 0.01 * LAMPORTS_PER_SOL;
    const totalRequired = requiredLamports + estimatedFee;
    
    console.log(`Wallet address: ${wallet.publicKey.toString()}`);
    console.log(`Connection endpoint: ${connection.rpcEndpoint}`);
    console.log(`Wallet balance: ${walletBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Required amount: ${requiredAmount} SOL`);
    console.log(`Required amount in lamports: ${requiredLamports}`);
    console.log(`Estimated fee: ${estimatedFee / LAMPORTS_PER_SOL} SOL`);
    console.log(`Total required (including fees): ${totalRequired / LAMPORTS_PER_SOL} SOL`);
    console.log(`Has sufficient balance: ${walletBalance >= totalRequired}`);
    
    return walletBalance >= totalRequired;
  } catch (error) {
    console.error('Error checking wallet balance:', error);
    return false;
  }
};

// Function to create a message payment
export const createMessagePayment = async (
  wallet: AnchorWallet,
  recipientAddress: string,
  amount: number,
  messageContent: string,
): Promise<string | undefined> => {
  try {
    console.log(`Creating message payment of ${amount} SOL to ${recipientAddress} for message: ${messageContent.slice(0, 30)}...`);

    // Check if wallet has sufficient balance before proceeding
    const hasSufficientBalance = await checkSufficientBalance(wallet, amount);
    if (!hasSufficientBalance) {
      throw new Error('Insufficient funds. Please add more SOL to your wallet to complete this transaction.');
    }

    // Convert recipient string to PublicKey for validation
    const recipientPublicKey = new PublicKey(recipientAddress);
    
    // Generate a simple message ID that will be used for the PDA seed
    // Using a simple 4-character ID for consistency with the program's expectations
    const messageId = `m${Date.now().toString(36).slice(-3)}`;
    console.log('Message ID:', messageId);
    
    // Connect to the program
    const program = await getProgram(wallet);
    
    // Convert SOL amount to lamports
    const lamports = amount * LAMPORTS_PER_SOL;
    
    // Derive the PDA for the escrow account
    const [escrowPDA, bump] = await deriveMessageEscrowPDA(
      wallet.publicKey, 
      recipientPublicKey,
      messageId,
      program
    );
    
    console.log('Sender public key:', wallet.publicKey.toBase58());
    console.log('Recipient public key:', recipientPublicKey.toBase58());
    console.log('Message ID (used as seed):', messageId);
    console.log('Escrow PDA:', escrowPDA.toBase58());
    console.log('PDA bump:', bump);
    
    // Submit the transaction
    const tx = await program.methods
      .createMessagePayment(
        new BN(lamports),
        messageId
      )
      .accounts({
        sender: wallet.publicKey,
        recipient: recipientPublicKey,
        messageEscrow: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('Transaction successful:', tx);
    
    // Save message in Supabase
    await saveMessage(
      wallet.publicKey.toBase58(),
      recipientAddress,
      messageId,
      messageContent,
      amount,
      tx
    );
    
    return tx;
  } catch (error) {
    console.error('Error in createMessagePayment:', error);
    
    // Improve error handling for specific error cases
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('insufficient funds') || 
          errorMessage.includes('attempt to debit an account') ||
          errorMessage.includes('Insufficient funds')) {
        console.error('Wallet balance check failed. Please check console logs for details.');
        throw new Error('Insufficient funds. Please add more SOL to your wallet to complete this transaction.');
      } else if (errorMessage.includes('User rejected')) {
        throw new Error('Transaction was rejected by the wallet.');
      } else if (errorMessage.includes('network error')) {
        throw new Error('Network error. Please check your connection to the Sonic DevNet.');
      } else if (errorMessage.includes('seeds constraint was violated')) {
        console.error('Seeds constraint violation. This could be due to an issue with the PDA derivation.');
        throw new Error('Transaction failed due to a technical issue with the escrow account. Please try again with a different message or amount.');
      } else if (errorMessage.includes('ConstraintSeeds')) {
        console.error('Seeds constraint error from Anchor program.');
        throw new Error('Transaction failed due to a technical issue with the escrow account. Please try again.');
      } else {
        // For any other errors, pass through the original message
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
    }
    
    throw error;
  }
};

// Function to approve a message payment
export const approveMessagePayment = async (
  wallet: AnchorWallet,
  senderAddress: string,
  messageId: string,
): Promise<string | undefined> => {
  try {
    console.log(`Approving message payment, message ID: ${messageId}`);
    
    // Connect to the program
    const program = await getProgram(wallet);
    
    // Convert sender string to PublicKey
    const senderPublicKey = new PublicKey(senderAddress);
    
    // Derive the PDA for the escrow account
    const [escrowPDA, bump] = await deriveMessageEscrowPDA(
      senderPublicKey,
      wallet.publicKey,
      messageId,
      program
    );
    
    console.log('Sender public key:', senderPublicKey.toBase58());
    console.log('Recipient public key:', wallet.publicKey.toBase58());
    console.log('Message ID (used as seed):', messageId);
    console.log('Escrow PDA:', escrowPDA.toBase58());
    console.log('PDA bump:', bump);
    
    // Submit the transaction
    const tx = await program.methods
      .approveMessagePayment()
      .accounts({
        sender: senderPublicKey,
        recipient: wallet.publicKey,
        messageEscrow: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('Approval transaction successful:', tx);
    
    // Update message status in Supabase
    await updateMessageStatus(messageId, 'approved', tx);
    
    return tx;
  } catch (error) {
    console.error('Error in approveMessagePayment:', error);
    
    // Improve error handling
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('ConstraintSeeds')) {
        console.error('Seeds constraint error from Anchor program.');
        throw new Error('Transaction failed due to a technical issue with the escrow account. Please try again.');
      } else {
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
    }
    
    throw error;
  }
};

// Function to reject a message payment
export const rejectMessagePayment = async (
  wallet: AnchorWallet,
  senderAddress: string,
  messageId: string,
): Promise<string | undefined> => {
  try {
    console.log(`Rejecting message payment, message ID: ${messageId}`);
    
    // Connect to the program
    const program = await getProgram(wallet);
    
    // Convert sender string to PublicKey
    const senderPublicKey = new PublicKey(senderAddress);
    
    // Derive the PDA for the escrow account
    const [escrowPDA, bump] = await deriveMessageEscrowPDA(
      senderPublicKey,
      wallet.publicKey,
      messageId,
      program
    );
    
    console.log('Sender public key:', senderPublicKey.toBase58());
    console.log('Recipient public key:', wallet.publicKey.toBase58());
    console.log('Message ID (used as seed):', messageId);
    console.log('Escrow PDA:', escrowPDA.toBase58());
    console.log('PDA bump:', bump);
    
    // Submit the transaction
    const tx = await program.methods
      .rejectMessagePayment()
      .accounts({
        sender: senderPublicKey,
        recipient: wallet.publicKey,
        messageEscrow: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('Rejection transaction successful:', tx);
    
    // Update message status in Supabase
    await updateMessageStatus(messageId, 'rejected', tx);
    
    return tx;
  } catch (error) {
    console.error('Error in rejectMessagePayment:', error);
    
    // Improve error handling
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('ConstraintSeeds')) {
        console.error('Seeds constraint error from Anchor program.');
        throw new Error('Transaction failed due to a technical issue with the escrow account. Please try again.');
      } else {
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
    }
    
    throw error;
  }
};

// Add sendPayment as an alias for createMessagePayment for backward compatibility
export const sendPayment = createMessagePayment;
