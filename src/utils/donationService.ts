
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BrowserWalletAdapter } from '@/utils/browserWalletAdapter';
import { updateMessageStatus } from '@/utils/messageService';
import { toast } from '@/components/ui/use-toast';
import * as anchor from '@coral-xyz/anchor';
import { Program, Idl } from '@coral-xyz/anchor';

// Import the IDL as a plain object
import rawIdl from '@/assets/pay_to_reply.json';

// Cast the imported JSON to the correct Idl type
const payToReplyIdl = rawIdl as Idl;

// Default donation address - for example, a nonprofit or charitable organization
export const DEFAULT_DONATION_ADDRESS = "Cf3sRJG3VwPSvrRhJgxMYrYqkNnTKaSTZpNRwwREuYRJ";

export interface DonationOptions {
  amountSol: number;
  donationAddress?: string;
  messageId?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Processes a donation transaction
 */
export const processDonation = async (
  wallet: BrowserWalletAdapter,
  options: DonationOptions
): Promise<string | null> => {
  const {
    amountSol,
    donationAddress = DEFAULT_DONATION_ADDRESS,
    messageId,
    onSuccess,
    onError
  } = options;

  try {
    console.log(`Processing donation of ${amountSol} SOL to ${donationAddress}`);
    
    if (!wallet) {
      throw new Error("Wallet not connected");
    }
    
    const connection = new Connection("https://api.testnet.sonic.game", "confirmed");
    const amountLamports = amountSol * LAMPORTS_PER_SOL;
    
    // Convert donation address to PublicKey
    const donationPubkey = new PublicKey(donationAddress);
    
    // Get program ID
    const programId = new PublicKey("GPS2swU3p4XGWisAh3n4QWQuMvrQdfnz2eSwME2dp66A");
    
    const anchorProvider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: "confirmed" }
    );
    
    // Create program instance using the imported IDL cast to the correct type
    const program = new Program(payToReplyIdl, programId, anchorProvider);
    
    // Send the donation transaction
    const signature = await program.methods
      .donateFunds(new anchor.BN(amountLamports))
      .accounts({
        donor: wallet.publicKey,
        donationAddress: donationPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Donation transaction signature:", signature);
    console.log(`https://explorer.sonic.game/tx/${signature}`);
    
    // If messageId is provided, update message status to include donation info
    if (messageId) {
      try {
        await updateMessageStatus(messageId, "approved", signature);
      } catch (error) {
        console.error("Error updating message status with donation info:", error);
      }
    }
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess(signature);
    }
    
    return signature;
  } catch (error) {
    console.error("Error processing donation:", error);
    
    // Call error callback if provided
    if (onError) {
      onError(error as Error);
    }
    
    return null;
  }
};
