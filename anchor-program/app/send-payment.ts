import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  clusterApiUrl
} from "@solana/web3.js";
import fs from "fs";
import path from "path";

// Load the IDL (this would be generated after building the program)
const idl = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../target/idl/pay_to_reply.json"),
    "utf-8"
  )
);

async function main() {
  // Configure connection to Sonic DevNet
  const connection = new Connection("https://api.testnet.sonic.game", "confirmed");
  
  // Load the sender's wallet from a keypair file
  // This can be replaced with any method to load a keypair
  const sender = loadWalletKey(process.env.WALLET_PATH || "~/.config/solana/id.json");
  
  // Create the wallet provider
  const wallet = new anchor.Wallet(sender);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });
  
  // Create the program interface
  const programId = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); 
  const program = new anchor.Program(idl, programId, provider);
  
  // Get the recipient's address from command line arguments or use a default
  const recipientAddress = process.argv[2] || "8rRSCYJWGrgEnBXUHtgUMseNBfkrXLHVQvVmvn7Puqp4";
  const recipient = new PublicKey(recipientAddress);
  
  // Amount to send (0.01 SOL by default)
  const amountInSOL = process.argv[3] ? parseFloat(process.argv[3]) : 0.01;
  const amount = amountInSOL * LAMPORTS_PER_SOL;
  
  console.log(`Sending ${amountInSOL} SOL from ${sender.publicKey.toString()} to ${recipient.toString()}`);
  
  try {
    // Send the payment
    const tx = await program.methods
      .sendMessagePayment(new anchor.BN(amount))
      .accounts({
        sender: sender.publicKey,
        recipient,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([sender])
      .rpc();
    
    console.log("Transaction successful with signature:", tx);
    console.log(`You can view the transaction at: https://explorer.sonic.game/tx/${tx}`);
  } catch (error) {
    console.error("Error sending payment:", error);
  }
}

// Helper function to load a wallet from a keypair file
function loadWalletKey(keypairFile: string): Keypair {
  const keypairPath = keypairFile.startsWith("~") 
    ? keypairFile.replace("~", process.env.HOME || "") 
    : keypairFile;
    
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
  );
  
  return loaded;
}

main().catch(console.error); 