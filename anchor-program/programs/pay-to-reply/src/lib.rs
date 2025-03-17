use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("GPS2swU3p4XGWisAh3n4QWQuMvrQdfnz2eSwME2dp66A");

#[program]
pub mod pay_to_reply {
    use super::*;

    /// Sends SOL from the sender to an escrow account as part of a message payment
    pub fn create_message_payment(
        ctx: Context<CreateMessagePayment>,
        amount: u64,
        message_id: String,
    ) -> Result<()> {
        // Create the escrow account data
        let message_escrow = &mut ctx.accounts.message_escrow;
        message_escrow.sender = ctx.accounts.sender.key();
        message_escrow.recipient = ctx.accounts.recipient.key();
        message_escrow.amount = amount;
        message_escrow.message_id = message_id.clone();
        message_escrow.status = EscrowStatus::Pending;
        message_escrow.created_at = Clock::get()?.unix_timestamp;

        // Transfer SOL from sender to escrow account
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.sender.key(),
            &ctx.accounts.message_escrow.key(),
            amount,
        );

        // Execute the transfer instruction
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.sender.to_account_info(),
                ctx.accounts.message_escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!(
            "Message payment escrow created: {} lamports from {} to {} for message {}",
            amount,
            ctx.accounts.sender.key(),
            ctx.accounts.recipient.key(),
            message_id
        );

        Ok(())
    }

    /// Approves a message payment, transferring SOL from escrow to recipient
    pub fn approve_message_payment(ctx: Context<ProcessMessagePayment>) -> Result<()> {
        let message_escrow = &mut ctx.accounts.message_escrow;
        
        // Verify the message is pending
        require_eq!(
            message_escrow.status,
            EscrowStatus::Pending,
            EscrowError::InvalidEscrowStatus
        );
        
        // Verify the recipient is the one approving
        require_keys_eq!(
            message_escrow.recipient,
            ctx.accounts.recipient.key(),
            EscrowError::InvalidRecipient
        );

        // Update escrow status
        message_escrow.status = EscrowStatus::Approved;
        message_escrow.processed_at = Clock::get()?.unix_timestamp;

        // Get the amount stored in the escrow account
        let escrow_info = ctx.accounts.message_escrow.to_account_info();
        let escrow_balance = **escrow_info.lamports.borrow();
        
        // Keep some lamports for rent exemption
        let rent = Rent::get()?;
        let data_len = escrow_info.data_len();
        let rent_exemption = rent.minimum_balance(data_len);
        
        // Calculate amount to transfer (balance minus rent exemption)
        let transfer_amount = escrow_balance - rent_exemption;

        // Transfer SOL from escrow to recipient
        **escrow_info.try_borrow_mut_lamports()? -= transfer_amount;
        **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += transfer_amount;

        msg!(
            "Message payment approved: {} lamports from escrow to {}",
            transfer_amount,
            ctx.accounts.recipient.key()
        );

        Ok(())
    }

    /// Rejects a message payment, returning SOL from escrow to sender
    pub fn reject_message_payment(ctx: Context<ProcessMessagePayment>) -> Result<()> {
        let message_escrow = &mut ctx.accounts.message_escrow;
        
        // Verify the message is pending
        require_eq!(
            message_escrow.status,
            EscrowStatus::Pending,
            EscrowError::InvalidEscrowStatus
        );
        
        // Verify the recipient is the one rejecting
        require_keys_eq!(
            message_escrow.recipient,
            ctx.accounts.recipient.key(),
            EscrowError::InvalidRecipient
        );

        // Update escrow status
        message_escrow.status = EscrowStatus::Rejected;
        message_escrow.processed_at = Clock::get()?.unix_timestamp;

        // Get the amount stored in the escrow account
        let escrow_info = ctx.accounts.message_escrow.to_account_info();
        let escrow_balance = **escrow_info.lamports.borrow();
        
        // Keep some lamports for rent exemption
        let rent = Rent::get()?;
        let data_len = escrow_info.data_len();
        let rent_exemption = rent.minimum_balance(data_len);
        
        // Calculate amount to transfer (balance minus rent exemption)
        let transfer_amount = escrow_balance - rent_exemption;

        // Transfer SOL from escrow back to sender
        **escrow_info.try_borrow_mut_lamports()? -= transfer_amount;
        **ctx.accounts.sender.to_account_info().try_borrow_mut_lamports()? += transfer_amount;

        msg!(
            "Message payment rejected: {} lamports returned from escrow to {}",
            transfer_amount,
            ctx.accounts.sender.key()
        );

        Ok(())
    }

    /// Donates funds from the donor to a charity/donation address
    pub fn donate_funds(
        ctx: Context<DonateFunds>,
        amount: u64,
    ) -> Result<()> {
        // Transfer SOL from donor to donation address
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.donor.key(),
            &ctx.accounts.donation_address.key(),
            amount,
        );

        // Execute the transfer instruction
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.donor.to_account_info(),
                ctx.accounts.donation_address.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!(
            "Donation processed: {} lamports from {} to donation address {}",
            amount,
            ctx.accounts.donor.key(),
            ctx.accounts.donation_address.key()
        );

        Ok(())
    }
}

/// Context for creating a message payment
#[derive(Accounts)]
#[instruction(amount: u64, message_id: String)]
pub struct CreateMessagePayment<'info> {
    /// The account sending SOL, must be a signer
    #[account(mut)]
    pub sender: Signer<'info>,
    
    /// The account that will receive SOL if approved
    /// CHECK: This is safe because we're not writing to this account
    pub recipient: AccountInfo<'info>,
    
    /// The escrow account that will hold the SOL temporarily
    #[account(
        init,
        payer = sender,
        space = MessageEscrow::space(),
        seeds = [
            b"msg",
            message_id[..4].as_bytes()
        ],
        bump
    )]
    pub message_escrow: Account<'info, MessageEscrow>,
    
    /// The system program, used for transfers and account creation
    pub system_program: Program<'info, System>,
}

/// Context for processing (approving/rejecting) a message payment
#[derive(Accounts)]
pub struct ProcessMessagePayment<'info> {
    /// The original sender of the payment
    #[account(mut)]
    /// CHECK: This is safe because we only credit this account when rejecting
    pub sender: AccountInfo<'info>,
    
    /// The recipient of the payment, must be a signer
    #[account(mut)]
    pub recipient: Signer<'info>,
    
    /// The escrow account holding the SOL
    #[account(
        mut,
        seeds = [
            b"msg",
            message_escrow.message_id[..4].as_bytes()
        ],
        bump,
        constraint = message_escrow.sender == sender.key() @ EscrowError::InvalidSender,
        constraint = message_escrow.recipient == recipient.key() @ EscrowError::InvalidRecipient
    )]
    pub message_escrow: Account<'info, MessageEscrow>,
    
    /// The system program, used for transfers
    pub system_program: Program<'info, System>,
}

/// Context for donating funds
#[derive(Accounts)]
pub struct DonateFunds<'info> {
    /// The account donating SOL, must be a signer
    #[account(mut)]
    pub donor: Signer<'info>,
    
    /// The donation address that will receive SOL
    /// CHECK: This is safe because we're only transferring to this account
    #[account(mut)]
    pub donation_address: AccountInfo<'info>,
    
    /// The system program, used for transfers
    pub system_program: Program<'info, System>,
}

/// Status of the escrow account
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Pending,
    Approved,
    Rejected,
}

impl std::fmt::Display for EscrowStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EscrowStatus::Pending => write!(f, "Pending"),
            EscrowStatus::Approved => write!(f, "Approved"),
            EscrowStatus::Rejected => write!(f, "Rejected"),
        }
    }
}

/// Escrow account data structure
#[account]
pub struct MessageEscrow {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub message_id: String,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub processed_at: i64,
}

impl MessageEscrow {
    pub fn space() -> usize {
        // Calculate space needed for the account data
        // 32 bytes each for sender and recipient public keys
        // 8 bytes for amount
        // 50 bytes for message_id (allowing for reasonable ID length)
        // 1 byte for status enum
        // 8 bytes each for timestamps
        // Plus some buffer for serialization overhead
        8 + // discriminator
        32 + // sender
        32 + // recipient
        8 + // amount
        4 + 50 + // message_id (4 bytes for string length + max 50 chars)
        1 + // status
        8 + // created_at
        8 // processed_at
    }
}

/// Error codes for escrow operations
#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow status")]
    InvalidEscrowStatus,
    #[msg("Invalid recipient")]
    InvalidRecipient,
    #[msg("Invalid sender")]
    InvalidSender,
}
