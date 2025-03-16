
import { supabase } from "@/integrations/supabase/client";
import { PublicKey } from "@solana/web3.js";

export type MessageStatus = 'pending' | 'approved' | 'rejected';

export interface MessageData {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number;
  created_at: string;
  message_id: string;
  content: string;
  status: MessageStatus;
  transaction_signature?: string;
  senderUsername?: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
  recipientUsername?: string;
}

/**
 * Fetch messages for a user based on wallet address
 * @param walletAddress The user's wallet address
 * @param type 'received' or 'sent'
 * @returns Array of messages
 */
export const fetchMessages = async (
  walletAddress: string | null,
  type: 'received' | 'sent' | 'all' = 'all'
): Promise<MessageData[]> => {
  if (!walletAddress) return [];

  try {
    // Find the profile ID associated with this wallet address
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      return [];
    }

    const userId = profileData.id;
    
    // Prepare the query based on the type
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, username, twitter_username, avatar_url),
        recipient:recipient_id(id, username, twitter_username, avatar_url)
      `);

    if (type === 'received') {
      query = query.eq('recipient_id', userId);
    } else if (type === 'sent') {
      query = query.eq('sender_id', userId);
    } else {
      // For 'all', fetch both sent and received
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    // Order by newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    // Format the messages with sender info
    return (data || []).map(msg => {
      const sender = msg.sender as any;
      const recipient = msg.recipient as any;
      
      return {
        ...msg,
        senderUsername: sender?.twitter_username || sender?.username || 'Unknown User',
        senderDisplayName: sender?.username || sender?.twitter_username || 'Unknown User',
        senderAvatarUrl: sender?.avatar_url || '',
        recipientUsername: recipient?.twitter_username || recipient?.username || 'Unknown User',
      };
    });
  } catch (error) {
    console.error('Error in fetchMessages:', error);
    return [];
  }
};

/**
 * Get message statistics for a user
 */
export const getMessageStats = async (walletAddress: string | null) => {
  if (!walletAddress) {
    return {
      pendingReceived: 0,
      approvedReceived: 0,
      totalReceived: 0,
      pendingSent: 0,
      approvedSent: 0,
      totalSent: 0,
      totalEarnings: 0
    };
  }

  try {
    // Find the profile ID associated with this wallet address
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      return {
        pendingReceived: 0,
        approvedReceived: 0,
        totalReceived: 0,
        pendingSent: 0,
        approvedSent: 0,
        totalSent: 0,
        totalEarnings: 0
      };
    }

    const userId = profileData.id;

    // Fetch received messages
    const { data: receivedMessages, error: receivedError } = await supabase
      .from('messages')
      .select('status, amount')
      .eq('recipient_id', userId);

    if (receivedError) {
      console.error('Error fetching received messages:', receivedError);
      return {
        pendingReceived: 0,
        approvedReceived: 0,
        totalReceived: 0,
        pendingSent: 0,
        approvedSent: 0,
        totalSent: 0,
        totalEarnings: 0
      };
    }

    // Fetch sent messages
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('status, amount')
      .eq('sender_id', userId);

    if (sentError) {
      console.error('Error fetching sent messages:', sentError);
      return {
        pendingReceived: 0,
        approvedReceived: 0,
        totalReceived: 0,
        pendingSent: 0,
        approvedSent: 0,
        totalSent: 0,
        totalEarnings: 0
      };
    }

    // Calculate stats
    const pendingReceived = receivedMessages.filter(msg => msg.status === 'pending').length;
    const approvedReceived = receivedMessages.filter(msg => msg.status === 'approved').length;
    const totalReceived = receivedMessages.length;
    
    const pendingSent = sentMessages.filter(msg => msg.status === 'pending').length;
    const approvedSent = sentMessages.filter(msg => msg.status === 'approved').length;
    const totalSent = sentMessages.length;
    
    const totalEarnings = receivedMessages
      .filter(msg => msg.status === 'approved')
      .reduce((sum, msg) => sum + (parseFloat(msg.amount as any) || 0), 0);

    return {
      pendingReceived,
      approvedReceived,
      totalReceived,
      pendingSent,
      approvedSent,
      totalSent,
      totalEarnings
    };
  } catch (error) {
    console.error('Error calculating message stats:', error);
    return {
      pendingReceived: 0,
      approvedReceived: 0,
      totalReceived: 0,
      pendingSent: 0,
      approvedSent: 0,
      totalSent: 0,
      totalEarnings: 0
    };
  }
};

/**
 * Save a message to the database
 */
export const saveMessage = async (
  senderWalletAddress: string,
  recipientWalletAddress: string,
  messageId: string,
  content: string,
  amount: number,
  transactionSignature?: string
): Promise<boolean> => {
  try {
    // Find sender profile ID
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', senderWalletAddress)
      .single();

    if (senderError || !senderProfile) {
      console.error('Sender profile not found:', senderError);
      return false;
    }

    // Find recipient profile ID
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', recipientWalletAddress)
      .single();

    if (recipientError || !recipientProfile) {
      console.error('Recipient profile not found:', recipientError);
      return false;
    }

    // Save the message
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderProfile.id,
          recipient_id: recipientProfile.id,
          message_id: messageId,
          content,
          amount,
          status: 'pending',
          transaction_signature: transactionSignature
        }
      ]);

    if (error) {
      console.error('Error saving message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveMessage:', error);
    return false;
  }
};

/**
 * Update message status
 */
export const updateMessageStatus = async (
  messageId: string,
  status: MessageStatus,
  transactionSignature?: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        status, 
        ...(transactionSignature ? { transaction_signature: transactionSignature } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('message_id', messageId);

    if (error) {
      console.error('Error updating message status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateMessageStatus:', error);
    return false;
  }
};
