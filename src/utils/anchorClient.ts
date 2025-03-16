import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import idlJSON from "../assets/pay_to_reply.json"; // We'll need to add this file later

// Program ID from the deployed anchor program
const PROGRAM_ID = "GPS2swU3p4XGWisAh3n4QWQuMvrQdfnz2eSwME2dp66A";

// Sonic DevNet connection
const connection = new Connection("https://api.testnet.sonic.game", "confirmed");

// Create AnchorProvider from browser wallet
export const createAnchorProvider = (wallet: any) => {
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { preflightCommitment: "confirmed" }
  );
  return provider;
};

// Helper function to create a short, deterministic ID from the original message ID
const shortenMessageId = (messageId: string): string => {
  // Take only the first 4 characters to keep the seed extremely short
  // This is necessary because Solana has a strict seed length limit
  return messageId.slice(0, 4);
};

// Create a message payment via the anchor program (puts SOL in escrow)
export const sendPayment = async (
  wallet: any,
  recipientAddress: string,
  amountInSOL: number,
  messageId: string = crypto.randomUUID()
): Promise<string> => {
  try {
    // Create the anchor provider with the wallet
    const provider = createAnchorProvider(wallet);
    
    // Cast the IDL to any type since we're loading it directly
    const idl = idlJSON as any;
    
    // Create the program interface
    const programId = new PublicKey(PROGRAM_ID);
    const program = new Program(idl, programId, provider);
    
    // Convert SOL amount to lamports
    const amount = new BN(amountInSOL * LAMPORTS_PER_SOL);
    
    // Create PublicKey from recipient address
    const recipient = new PublicKey(recipientAddress);
    
    // Shorten the message ID to keep seed length under the limit
    const shortMessageId = shortenMessageId(messageId);
    
    console.log(`Creating message payment of ${amountInSOL} SOL to ${recipient.toString()} for message ${messageId} (shortened: ${shortMessageId})`);
    
    // Find the PDA for the message escrow account using the shortened message ID
    // Use minimal seed data to prevent exceeding the seed length limit
    const [messageEscrowPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("msg"), // Shortened from "message_escrow"
        Buffer.from(shortMessageId)
      ],
      programId
    );
    
    console.log(`Escrow PDA: ${messageEscrowPDA.toString()}`);
    
    // Send the transaction
    const tx = await program.methods
      .createMessagePayment(amount, messageId) // Keep full messageId in the instruction for database reference
      .accounts({
        sender: provider.wallet.publicKey,
        recipient,
        messageEscrow: messageEscrowPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Transaction successful:", tx);
    
    return tx;
  } catch (error) {
    console.error("Error creating message payment:", error);
    throw error;
  }
};

// Approve a message payment (transfer SOL from escrow to recipient)
export const approveMessagePayment = async (
  wallet: any,
  senderAddress: string,
  messageId: string
): Promise<string> => {
  try {
    // Create the anchor provider with the wallet
    const provider = createAnchorProvider(wallet);
    
    // Cast the IDL to any type since we're loading it directly
    const idl = idlJSON as any;
    
    // Create the program interface
    const programId = new PublicKey(PROGRAM_ID);
    const program = new Program(idl, programId, provider);
    
    // Create PublicKey from sender address
    const sender = new PublicKey(senderAddress);
    
    // Shorten the message ID to match what was used in sendPayment
    const shortMessageId = shortenMessageId(messageId);
    
    console.log(`Approving message payment from ${sender.toString()} for message ${messageId} (shortened: ${shortMessageId})`);
    
    // Find the PDA for the message escrow account
    const [messageEscrowPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("msg"),
        Buffer.from(shortMessageId)
      ],
      programId
    );
    
    console.log(`Escrow PDA: ${messageEscrowPDA.toString()}`);
    
    // Send the transaction
    const tx = await program.methods
      .approveMessagePayment()
      .accounts({
        sender,
        recipient: provider.wallet.publicKey,
        messageEscrow: messageEscrowPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Approval transaction successful:", tx);
    
    return tx;
  } catch (error) {
    console.error("Error approving message payment:", error);
    throw error;
  }
};

// Reject a message payment (return SOL from escrow to sender)
export const rejectMessagePayment = async (
  wallet: any,
  senderAddress: string,
  messageId: string
): Promise<string> => {
  try {
    // Create the anchor provider with the wallet
    const provider = createAnchorProvider(wallet);
    
    // Cast the IDL to any type since we're loading it directly
    const idl = idlJSON as any;
    
    // Create the program interface
    const programId = new PublicKey(PROGRAM_ID);
    const program = new Program(idl, programId, provider);
    
    // Create PublicKey from sender address
    const sender = new PublicKey(senderAddress);
    
    // Shorten the message ID to match what was used in sendPayment
    const shortMessageId = shortenMessageId(messageId);
    
    console.log(`Rejecting message payment from ${sender.toString()} for message ${messageId} (shortened: ${shortMessageId})`);
    
    // Find the PDA for the message escrow account
    const [messageEscrowPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("msg"),
        Buffer.from(shortMessageId)
      ],
      programId
    );
    
    console.log(`Escrow PDA: ${messageEscrowPDA.toString()}`);
    
    // Send the transaction
    const tx = await program.methods
      .rejectMessagePayment()
      .accounts({
        sender,
        recipient: provider.wallet.publicKey,
        messageEscrow: messageEscrowPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Rejection transaction successful:", tx);
    
    return tx;
  } catch (error) {
    console.error("Error rejecting message payment:", error);
    throw error;
  }
};

// Find and fetch message escrow account data
export const fetchMessageEscrow = async (
  senderAddress: string,
  recipientAddress: string,
  messageId: string
) => {
  try {
    // Create a read-only provider
    const provider = new anchor.AnchorProvider(
      connection,
      { publicKey: new PublicKey(recipientAddress) } as any,
      { preflightCommitment: "confirmed" }
    );
    
    // Cast the IDL to any type since we're loading it directly
    const idl = idlJSON as any;
    
    // Create the program interface
    const programId = new PublicKey(PROGRAM_ID);
    const program = new Program(idl, programId, provider);
    
    // Create PublicKeys
    const sender = new PublicKey(senderAddress);
    const recipient = new PublicKey(recipientAddress);
    
    // Shorten the message ID to match what was used in sendPayment
    const shortMessageId = shortenMessageId(messageId);
    
    // Find the PDA for the message escrow account
    const [messageEscrowPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("msg"),
        Buffer.from(shortMessageId)
      ],
      programId
    );
    
    console.log(`Fetching escrow PDA: ${messageEscrowPDA.toString()}`);
    
    // Fetch the account data
    const escrowAccount = await program.account.messageEscrow.fetch(messageEscrowPDA);
    return escrowAccount;
  } catch (error) {
    console.error("Error fetching message escrow:", error);
    return null;
  }
};
