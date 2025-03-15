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

// Send payment via the anchor program
export const sendPayment = async (
  wallet: any,
  recipientAddress: string,
  amountInSOL: number
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
    
    console.log(`Sending ${amountInSOL} SOL to ${recipient.toString()}`);
    
    // Send the transaction
    const tx = await program.methods
      .sendMessagePayment(amount)
      .accounts({
        sender: provider.wallet.publicKey,
        recipient,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Transaction successful:", tx);
    
    return tx;
  } catch (error) {
    console.error("Error sending payment:", error);
    throw error;
  }
}; 