
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { PayToReply } from "../target/types/pay_to_reply";
import { expect } from "chai";

describe("Squeaky Wheel", () => {
  // Configure the client to use the Sonic DevNet cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PayToReply as Program<PayToReply>;
  
  // Create a new keypair for the recipient
  const recipientKeypair = Keypair.generate();
  const recipientPubkey = recipientKeypair.publicKey;
  
  // Reference to the sender (the wallet used for deployment)
  const senderPubkey = provider.wallet.publicKey;
  
  // Create a keypair for the donation address
  const donationKeypair = Keypair.generate();
  const donationPubkey = donationKeypair.publicKey;
  
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
    console.log("https://explorer.sonic.game/tx/" + tx);
    
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
  
  it("Donates SOL to a donation address", async () => {
    // Amount to donate: 0.0005 SOL
    const amount = 0.0005 * LAMPORTS_PER_SOL;
    
    // Get initial balances
    const connection = provider.connection;
    const initialDonorBalance = await connection.getBalance(senderPubkey);
    const initialDonationAddressBalance = await connection.getBalance(donationPubkey);
    
    console.log(`Initial donor balance: ${initialDonorBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Initial donation address balance: ${initialDonationAddressBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Send the donation
    const tx = await program.methods
      .donateFunds(new anchor.BN(amount))
      .accounts({
        donor: senderPubkey,
        donationAddress: donationPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Donation transaction signature:", tx);
    console.log("https://explorer.sonic.game/tx/" + tx);
    
    // Get final balances
    const finalDonorBalance = await connection.getBalance(senderPubkey);
    const finalDonationAddressBalance = await connection.getBalance(donationPubkey);
    
    console.log(`Final donor balance: ${finalDonorBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Final donation address balance: ${finalDonationAddressBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Verify the donation address received the exact amount
    expect(finalDonationAddressBalance).to.equal(initialDonationAddressBalance + amount);
    
    // Verify the donor's balance decreased by at least the amount sent
    // (it will be slightly more due to transaction fees)
    expect(finalDonorBalance).to.be.lessThan(initialDonorBalance - amount);
  });
}); 
