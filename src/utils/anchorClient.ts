import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction, VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import { saveMessage, updateMessageStatus } from './messageService';
import { supabase } from "@/integrations/supabase/client";

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
    if (!messageId) {
        console.error('Message ID is undefined or empty');
        throw new Error('Invalid message ID: Cannot derive PDA without a message ID');
    }
    
    if (messageId.length < 4) {
        console.error('Message ID is too short:', messageId);
        throw new Error('Invalid message ID: Message ID must be at least 4 characters long');
    }
    
    console.log('Deriving PDA with:');
    console.log('- Sender:', sender.toBase58());
    console.log('- Recipient:', recipient.toBase58());
    console.log('- Message ID:', messageId);
    console.log('- Using first 4 characters for seed:', messageId.slice(0, 4));
    console.log('- Program ID:', program.programId.toBase58());
    
    try {
        // The Anchor program uses only two seeds:
        // 1. The string "msg" as a prefix
        // 2. The first 4 bytes of the message ID
        const seeds = [
            Buffer.from("msg"),
            Buffer.from(messageId.slice(0, 4))
        ];
        
        console.log('PDA seeds:', {
            seed1: "msg",
            seed2: messageId.slice(0, 4)
        });
        
        const [pda, bump] = await PublicKey.findProgramAddress(
            seeds,
            program.programId
        );
        
        console.log('Derived PDA:', pda.toBase58());
        console.log('PDA bump:', bump);
        
        return [pda, bump];
    } catch (error) {
        console.error('Error deriving PDA:', error);
        throw new Error(`Failed to derive PDA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    // Format: 'm' + 3 characters from timestamp in base36
    const messageId = `m${Date.now().toString(36).slice(-3)}`;
    console.log('Generated Message ID:', messageId);
    
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
    
    // Save message in Supabase - IMPORTANT: Use the same messageId that was used in the blockchain transaction
    const saveResult = await saveMessage(
      wallet.publicKey.toBase58(),
      recipientAddress,
      messageId, // Use the exact same messageId that was used in the blockchain
      messageContent,
      amount,
      tx
    );
    
    if (!saveResult) {
      console.error('Failed to save message to database');
      throw new Error('Transaction was successful, but failed to save message details. Please check your messages later.');
    }
    
    console.log('Message saved to database with ID:', messageId);
    
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
    console.log(`Sender address provided: ${senderAddress}`);
    console.log(`Recipient wallet address: ${wallet.publicKey.toBase58()}`);
    
    if (!senderAddress) {
      console.error('Sender address is undefined or null');
      throw new Error('Invalid sender address: The sender address is missing');
    }
    
    if (!messageId) {
      console.error('Message ID is undefined or null');
      throw new Error('Invalid message ID: The message ID is missing');
    }
    
    // Validate message ID format
    if (!messageId.startsWith('m') || messageId.length < 4) {
      console.error('Invalid message ID format:', messageId);
      throw new Error('Invalid message ID format. The message ID should start with "m" followed by at least 3 characters.');
    }
    
    // Connect to the program
    const program = await getProgram(wallet);
    
    // Check if senderAddress is a UUID (database ID) or a wallet address
    let senderPublicKey;
    
    // If it's a UUID (not a valid base58 string), we need to fetch the wallet address
    try {
      senderPublicKey = new PublicKey(senderAddress);
      console.log('Sender address is a valid public key:', senderPublicKey.toBase58());
    } catch (error) {
      console.log('Sender address is not a valid public key, assuming it\'s a database ID:', senderAddress);
      
      // Fetch the sender's wallet address from the database
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', senderAddress)
        .single();
      
      if (senderError) {
        console.error('Error fetching sender profile:', senderError);
        throw new Error(`Failed to find sender wallet address: ${senderError.message}`);
      }
      
      if (!senderProfile) {
        console.error('Sender profile not found for ID:', senderAddress);
        throw new Error('Sender profile not found in database');
      }
      
      if (!senderProfile.wallet_address) {
        console.error('Wallet address is missing in sender profile:', senderProfile);
        throw new Error('Sender wallet address not found in database');
      }
      
      console.log('Found sender wallet address:', senderProfile.wallet_address);
      senderPublicKey = new PublicKey(senderProfile.wallet_address);
    }
    
    // Verify we have a valid sender public key
    if (!senderPublicKey) {
      throw new Error('Failed to determine sender public key');
    }
    
    console.log('Using sender public key:', senderPublicKey.toBase58());
    
    // Derive the PDA for the escrow account
    console.log('Deriving escrow PDA with:');
    console.log('- Sender:', senderPublicKey.toBase58());
    console.log('- Recipient:', wallet.publicKey.toBase58());
    console.log('- Message ID:', messageId);
    
    const [escrowPDA, bump] = await deriveMessageEscrowPDA(
      senderPublicKey,
      wallet.publicKey,
      messageId,
      program
    );
    
    console.log('Escrow PDA derived successfully:', escrowPDA.toBase58());
    console.log('PDA bump:', bump);
    
    // Get the Anchor provider and connection
    const provider = getProvider(wallet);
    const connection = provider.connection;
    
    // Create a transaction instruction with proper account metadata
    const ix = await program.methods
      .approveMessagePayment()
      .accounts({
        sender: senderPublicKey,
        recipient: wallet.publicKey,
        messageEscrow: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    
    // Create transaction and add the instruction
    const tx = new Transaction();
    tx.add(ix);
    
    // Explicitly mark the sender account as writable in the transaction
    // Find the sender account in the instruction accounts
    const senderAccountMeta = tx.instructions[0].keys.find(
      (key) => key.pubkey.equals(senderPublicKey)
    );
    
    if (senderAccountMeta) {
      console.log('Found sender account in transaction, marking as writable');
      senderAccountMeta.isWritable = true;
    } else {
      console.error('Could not find sender account in transaction keys');
    }
    
    // Submit the transaction
    console.log('Submitting approveMessagePayment transaction...');
    const txid = await provider.sendAndConfirm(tx);
    
    console.log('Approval transaction successful:', txid);
    
    // Update message status in Supabase
    await updateMessageStatus(messageId, 'approved', txid);
    
    return txid;
  } catch (error) {
    console.error('Error in approveMessagePayment:', error);
    
    // Improve error handling
    if (error instanceof Error) {
      const errorMessage = error.message;
      console.error('Error details:', errorMessage);
      
      if (errorMessage.includes('ConstraintMut') || errorMessage.includes('mut constraint was violated')) {
        console.error('Mut constraint error from Anchor program. This usually means an account that needs to be writable was not marked as such.');
        throw new Error('Transaction failed: A technical issue occurred with account permissions. Please try again.');
      } else if (errorMessage.includes('ConstraintSeeds')) {
        console.error('Seeds constraint error from Anchor program.');
        throw new Error('Transaction failed due to a technical issue with the escrow account. Please try again.');
      } else if (errorMessage.includes('Non-base58 character')) {
        throw new Error('Transaction failed: Invalid wallet address format');
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        throw new Error('Transaction failed: Missing data in the transaction. This may be due to an invalid message ID or sender address.');
      } else {
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
    } else {
      throw new Error('Transaction failed: Unknown error');
    }
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
    console.log(`Sender address provided: ${senderAddress}`);
    console.log(`Recipient wallet address: ${wallet.publicKey.toBase58()}`);
    
    if (!senderAddress) {
      console.error('Sender address is undefined or null');
      throw new Error('Invalid sender address: The sender address is missing');
    }
    
    if (!messageId) {
      console.error('Message ID is undefined or null');
      throw new Error('Invalid message ID: The message ID is missing');
    }
    
    // Validate message ID format
    if (!messageId.startsWith('m') || messageId.length < 4) {
      console.error('Invalid message ID format:', messageId);
      throw new Error('Invalid message ID format. The message ID should start with "m" followed by at least 3 characters.');
    }
    
    // Connect to the program
    const program = await getProgram(wallet);
    
    // Check if senderAddress is a UUID (database ID) or a wallet address
    let senderPublicKey;
    
    // If it's a UUID (not a valid base58 string), we need to fetch the wallet address
    try {
      senderPublicKey = new PublicKey(senderAddress);
      console.log('Sender address is a valid public key:', senderPublicKey.toBase58());
    } catch (error) {
      console.log('Sender address is not a valid public key, assuming it\'s a database ID:', senderAddress);
      
      // Fetch the sender's wallet address from the database
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', senderAddress)
        .single();
      
      if (senderError) {
        console.error('Error fetching sender profile:', senderError);
        throw new Error(`Failed to find sender wallet address: ${senderError.message}`);
      }
      
      if (!senderProfile) {
        console.error('Sender profile not found for ID:', senderAddress);
        throw new Error('Sender profile not found in database');
      }
      
      if (!senderProfile.wallet_address) {
        console.error('Wallet address is missing in sender profile:', senderProfile);
        throw new Error('Sender wallet address not found in database');
      }
      
      console.log('Found sender wallet address:', senderProfile.wallet_address);
      senderPublicKey = new PublicKey(senderProfile.wallet_address);
    }
    
    // Verify we have a valid sender public key
    if (!senderPublicKey) {
      throw new Error('Failed to determine sender public key');
    }
    
    console.log('Using sender public key:', senderPublicKey.toBase58());
    
    // Derive the PDA for the escrow account
    console.log('Deriving escrow PDA with:');
    console.log('- Sender:', senderPublicKey.toBase58());
    console.log('- Recipient:', wallet.publicKey.toBase58());
    console.log('- Message ID:', messageId);
    
    const [escrowPDA, bump] = await deriveMessageEscrowPDA(
      senderPublicKey,
      wallet.publicKey,
      messageId,
      program
    );
    
    console.log('Escrow PDA derived successfully:', escrowPDA.toBase58());
    console.log('PDA bump:', bump);
    
    // Get the Anchor provider and connection
    const provider = getProvider(wallet);
    const connection = provider.connection;
    
    // Create a transaction instruction with proper account metadata
    const ix = await program.methods
      .rejectMessagePayment()
      .accounts({
        sender: senderPublicKey,
        recipient: wallet.publicKey,
        messageEscrow: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    
    // Create transaction and add the instruction
    const tx = new Transaction();
    tx.add(ix);
    
    // Explicitly mark the sender account as writable in the transaction
    // Find the sender account in the instruction accounts
    const senderAccountMeta = tx.instructions[0].keys.find(
      (key) => key.pubkey.equals(senderPublicKey)
    );
    
    if (senderAccountMeta) {
      console.log('Found sender account in transaction, marking as writable');
      senderAccountMeta.isWritable = true;
    } else {
      console.error('Could not find sender account in transaction keys');
    }
    
    // Submit the transaction
    console.log('Submitting rejectMessagePayment transaction...');
    const txid = await provider.sendAndConfirm(tx);
    
    console.log('Rejection transaction successful:', txid);
    
    // Update message status in Supabase
    await updateMessageStatus(messageId, 'rejected', txid);
    
    return txid;
  } catch (error) {
    console.error('Error in rejectMessagePayment:', error);
    
    // Improve error handling
    if (error instanceof Error) {
      const errorMessage = error.message;
      console.error('Error details:', errorMessage);
      
      if (errorMessage.includes('ConstraintMut') || errorMessage.includes('mut constraint was violated')) {
        console.error('Mut constraint error from Anchor program. This usually means an account that needs to be writable was not marked as such.');
        throw new Error('Transaction failed: A technical issue occurred with account permissions. Please try again.');
      } else if (errorMessage.includes('ConstraintSeeds')) {
        console.error('Seeds constraint error from Anchor program.');
        throw new Error('Transaction failed due to a technical issue with the escrow account. Please try again.');
      } else if (errorMessage.includes('Non-base58 character')) {
        throw new Error('Transaction failed: Invalid wallet address format');
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        throw new Error('Transaction failed: Missing data in the transaction. This may be due to an invalid message ID or sender address.');
      } else {
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
    } else {
      throw new Error('Transaction failed: Unknown error');
    }
  }
};

// Add sendPayment as an alias for createMessagePayment for backward compatibility
export const sendPayment = createMessagePayment;

// Check if a message escrow account exists on the blockchain
export const checkMessageExists = async (
  wallet: AnchorWallet,
  senderAddress: string,
  messageId: string
): Promise<boolean> => {
  try {
    console.log(`Checking if message exists, message ID: ${messageId}`);
    console.log(`Sender address provided: ${senderAddress}`);
    console.log(`Recipient wallet address: ${wallet.publicKey.toBase58()}`);
    
    if (!senderAddress || !messageId) {
      console.error('Missing required parameters:', { senderAddress, messageId });
      return false;
    }
    
    // Validate message ID format
    if (!messageId.startsWith('m') || messageId.length < 4) {
      console.error('Invalid message ID format:', messageId);
      console.error('Message ID should start with "m" followed by at least 3 characters');
      return false;
    }
    
    // Connect to the program
    const program = await getProgram(wallet);
    
    // Check if senderAddress is a UUID (database ID) or a wallet address
    let senderPublicKey;
    
    // If it's a UUID (not a valid base58 string), we need to fetch the wallet address
    try {
      senderPublicKey = new PublicKey(senderAddress);
      console.log('Sender address is a valid public key:', senderPublicKey.toBase58());
    } catch (error) {
      console.log('Sender address is not a valid public key, assuming it\'s a database ID:', senderAddress);
      
      // Fetch the sender's wallet address from the database
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', senderAddress)
        .single();
      
      if (senderError || !senderProfile || !senderProfile.wallet_address) {
        console.error('Error fetching sender profile:', senderError || 'No profile or wallet address found');
        return false;
      }
      
      console.log('Found sender wallet address:', senderProfile.wallet_address);
      senderPublicKey = new PublicKey(senderProfile.wallet_address);
    }
    
    // Derive the PDA for the escrow account
    console.log('Deriving PDA with message ID:', messageId);
    console.log('Using first 4 characters for seed:', messageId.slice(0, 4));
    
    const [escrowPDA, bump] = await deriveMessageEscrowPDA(
      senderPublicKey,
      wallet.publicKey,
      messageId,
      program
    );
    
    console.log('Escrow PDA derived:', escrowPDA.toBase58());
    console.log('PDA bump:', bump);
    
    // Check if the account exists
    const provider = getProvider(wallet);
    const connection = provider.connection;
    const accountInfo = await connection.getAccountInfo(escrowPDA);
    
    const exists = accountInfo !== null;
    console.log(`Message escrow account ${exists ? 'exists' : 'does not exist'} on-chain`);
    
    return exists;
  } catch (error) {
    console.error('Error checking if message exists:', error);
    return false;
  }
};
