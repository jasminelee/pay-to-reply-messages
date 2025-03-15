import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { PayToReply } from "../target/types/pay_to_reply";
import { expect } from "chai";

describe("Pay To Reply", () => {
  // Configure the client to use the Sonic DevNet cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PayToReply as Program<PayToReply>;
  
  // Create a new keypair for the recipient
  const recipientKeypair = Keypair.generate();
  const recipientPubkey = recipientKeypair.publicKey;
  
  // Reference to the sender (the wallet used for deployment)
  const senderPubkey = provider.wallet.publicKey;
  
  it("Sends SOL from sender to recipient", async () => {
    // Amount to send: 0.001 SOL
    const amount = 0.001 * LAMPORTS_PER_SOL;
    
    // Get initial balances
    const connection = provider.connection;
    const initialSenderBalance = await connection.getBalance(senderPubkey);
    const initialRecipientBalance = await connection.getBalance(recipientPubkey);
    
    console.log(`Initial sender balance: ${initialSenderBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Initial recipient balance: ${initialRecipientBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Send the payment
    const tx = await program.methods
      .sendMessagePayment(new anchor.BN(amount))
      .accounts({
        sender: senderPubkey,
        recipient: recipientPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Get final balances
    const finalSenderBalance = await connection.getBalance(senderPubkey);
    const finalRecipientBalance = await connection.getBalance(recipientPubkey);
    
    console.log(`Final sender balance: ${finalSenderBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Final recipient balance: ${finalRecipientBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Verify the recipient received the exact amount
    expect(finalRecipientBalance).to.equal(initialRecipientBalance + amount);
    
    // Verify the sender's balance decreased by at least the amount sent
    // (it will be slightly more due to transaction fees)
    expect(finalSenderBalance).to.be.lessThan(initialSenderBalance - amount);
  });
}); 