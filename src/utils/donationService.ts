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

// List of charity organizations that accept crypto donations
export interface CharityOrganization {
  name: string;
  address: string;
  description: string;
}

export const CHARITY_ORGANIZATIONS: CharityOrganization[] = [
  {
    name: "Charity: Water",
    address: "Cf3sRJG3VwPSvrRhJgxMYrYqkNnTKaSTZpNRwwREuYRJ",
    description: "Provides clean water to people in developing countries"
  },
  {
    name: "Save the Children",
    address: "H8FdB3GQmxnKZLdJjfCfMsJBuWSNkA7jW9xjnbNTrV7f",
    description: "Helps improve the lives of children around the world"
  },
  {
    name: "World Food Program USA",
    address: "5VvmKFZLqqeqUvHmKL3V6rNDPJnfYEnR9YoCqXMmH3eR",
    description: "Fights hunger worldwide through food assistance"
  },
  {
    name: "UNICEF",
    address: "D4JKs4QZM9ybLtEH5mYwxCGfPsHGnDfKzxvKyrJDM4U4",
    description: "Works to improve the lives of children globally"
  },
  {
    name: "Doctors Without Borders",
    address: "GhJKWvwZkUuxCXvBVbNEfGnGFmgXdY88qKxXrZ9jQVSc",
    description: "Delivers medical care to crisis-affected communities"
  },
  {
    name: "Electronic Frontier Foundation",
    address: "3CmPFtCWRgZZF6SmJ2JduKTFMBoSmudMb6k8heG5Eiuv",
    description: "Defends digital privacy, free speech, and innovation"
  },
  {
    name: "The Water Project",
    address: "7BXgR6LZX7h1N56idPfXd3rNwak6Tg1JZXVdBp2qeSVJ",
    description: "Provides clean, safe water to communities in sub-Saharan Africa"
  }
];

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
