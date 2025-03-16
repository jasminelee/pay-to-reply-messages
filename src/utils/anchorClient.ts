import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import { saveMessage, updateMessageStatus } from './messageService';

// AnchorWallet interface definition
export interface AnchorWallet {
  publicKey: PublicKey;
  signTransaction: (transaction: anchor.web3.Transaction) => Promise<anchor.web3.Transaction>;
  signAllTransactions: (transactions: anchor.web3.Transaction[]) => Promise<anchor.web3.Transaction[]>;
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
  const connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl("devnet")
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
    return await PublicKey.findProgramAddress(
        [
            anchor.utils.bytes.utf8.encode("message-escrow"),
            sender.toBuffer(),
            recipient.toBuffer(),
            anchor.utils.bytes.utf8.encode(messageId),
        ],
        program.programId
    );
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

    // Generate a unique message ID (timestamp + random string)
    const messageId = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
    console.log('Full message ID:', messageId);
    
    // Use only first 4 chars for the blockchain seed
    const shortMessageId = messageId.slice(0, 4);
    console.log('Using shortened message ID for seed:', shortMessageId);

    // Connect to the program
    const program = await getProgram(wallet);
    
    // Convert SOL amount to lamports
    const lamports = amount * LAMPORTS_PER_SOL;
    
    // Convert recipient string to PublicKey
    const recipientPublicKey = new PublicKey(recipientAddress);
    
    // Derive the PDA for the escrow account
    const [escrowPDA] = await deriveMessageEscrowPDA(
      wallet.publicKey, 
      recipientPublicKey,
      shortMessageId,
      program
    );
    
    console.log('Escrow PDA:', escrowPDA.toBase58());
    
    // Submit the transaction
    const tx = await program.methods
      .createMessagePayment(
        new BN(lamports),
        shortMessageId
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
    
    // Use only first 4 chars for the blockchain seed (same as when creating)
    const shortMessageId = messageId.slice(0, 4);
    console.log('Using shortened message ID for seed:', shortMessageId);

    // Connect to the program
    const program = await getProgram(wallet);
    
    // Convert sender string to PublicKey
    const senderPublicKey = new PublicKey(senderAddress);
    
    // Derive the PDA for the escrow account
    const [escrowPDA] = await deriveMessageEscrowPDA(
      senderPublicKey,
      wallet.publicKey,
      shortMessageId,
      program
    );
    
    console.log('Escrow PDA:', escrowPDA.toBase58());
    
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
    
    // Use only first 4 chars for the blockchain seed (same as when creating)
    const shortMessageId = messageId.slice(0, 4);
    console.log('Using shortened message ID for seed:', shortMessageId);

    // Connect to the program
    const program = await getProgram(wallet);
    
    // Convert sender string to PublicKey
    const senderPublicKey = new PublicKey(senderAddress);
    
    // Derive the PDA for the escrow account
    const [escrowPDA] = await deriveMessageEscrowPDA(
      senderPublicKey,
      wallet.publicKey,
      shortMessageId,
      program
    );
    
    console.log('Escrow PDA:', escrowPDA.toBase58());
    
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
    throw error;
  }
};

// Add sendPayment as an alias for createMessagePayment for backward compatibility
export const sendPayment = createMessagePayment;
