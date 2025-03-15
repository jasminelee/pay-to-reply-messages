use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod pay_to_reply {
    use super::*;

    /// Sends SOL from the sender to the recipient as part of a message payment
    pub fn send_message_payment(ctx: Context<SendMessagePayment>, amount: u64) -> Result<()> {
        // Create a CPI context for the transfer
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.sender.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
        );

        // Execute the transfer
        system_program::transfer(cpi_context, amount)?;

        // Log the transaction details
        msg!("Transfer of {} lamports from {} to {} complete", 
            amount, 
            ctx.accounts.sender.key(), 
            ctx.accounts.recipient.key()
        );

        Ok(())
    }
}

/// Context for sending a message payment
#[derive(Accounts)]
pub struct SendMessagePayment<'info> {
    /// The account sending SOL, must be a signer
    #[account(mut)]
    pub sender: Signer<'info>,
    
    /// The account receiving SOL
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    
    /// The system program, used for transferring SOL
    pub system_program: Program<'info, System>,
} 