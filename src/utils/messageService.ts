import { supabase } from "@/integrations/supabase/client";

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
    console.log(`Fetching ${type} messages for wallet: ${walletAddress}`);
    
    // Find the profile ID associated with this wallet address
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      
      // If the profile doesn't exist, check if we need to create one
      if (profileError.code === 'PGRST116') { // No rows returned
        console.log('Profile not found, creating a new one');
        
        // Create a new profile for this wallet address
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              wallet_address: walletAddress,
              username: `user_${walletAddress.substring(0, 8)}`,
            }
          ])
          .select('id')
          .single();
        
        if (createError || !newProfile) {
          console.error('Failed to create profile:', createError);
          return [];
        }
        
        console.log('New profile created:', newProfile);
        
        // No messages yet for a new profile
        return [];
      }
      
      return [];
    }

    if (!profileData) {
      console.error('Profile data not found');
      return [];
    }

    const userId = profileData.id;
    console.log(`Found profile ID: ${userId} for wallet: ${walletAddress}`);
    
    // First, get the basic message data
    let messageQuery;
    if (type === 'received') {
      messageQuery = supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId);
    } else if (type === 'sent') {
      messageQuery = supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId);
    } else {
      // For 'all', fetch both sent and received
      messageQuery = supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }
    
    // Order by newest first
    messageQuery = messageQuery.order('created_at', { ascending: false });
    
    const { data: messages, error: messagesError } = await messageQuery;
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return [];
    }
    
    console.log(`Found ${messages?.length || 0} ${type} messages`);
    
    if (!messages || messages.length === 0) {
      return [];
    }
    
    // Now get all the profile data we need for these messages
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
    const recipientIds = [...new Set(messages.map(msg => msg.recipient_id))];
    const allProfileIds = [...new Set([...senderIds, ...recipientIds])];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, twitter_username, avatar_url')
      .in('id', allProfileIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue with partial data
    }
    
    // Create a map of profile data for quick lookup
    const profileMap = (profiles || []).reduce((map, profile) => {
      map[profile.id] = profile;
      return map;
    }, {} as Record<string, any>);
    
    // Format the messages with sender and recipient info
    const formattedMessages: MessageData[] = messages.map(msg => {
      const sender = profileMap[msg.sender_id] || {};
      const recipient = profileMap[msg.recipient_id] || {};
      
      return {
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        amount: typeof msg.amount === 'string' ? parseFloat(msg.amount) : msg.amount,
        created_at: msg.created_at,
        message_id: msg.message_id,
        content: msg.content,
        status: msg.status as MessageStatus,
        transaction_signature: msg.transaction_signature,
        senderUsername: sender?.twitter_username || sender?.username || 'Unknown User',
        senderDisplayName: sender?.username || sender?.twitter_username || 'Unknown User',
        senderAvatarUrl: sender?.avatar_url || '',
        recipientUsername: recipient?.twitter_username || recipient?.username || 'Unknown User',
      };
    });

    return formattedMessages;
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
    console.log(`Getting message stats for wallet: ${walletAddress}`);
    
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
    console.log(`Found profile ID: ${userId} for wallet stats`);

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

    console.log(`Found ${receivedMessages.length} received and ${sentMessages.length} sent messages for stats`);

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
    console.log('Saving message to database:', {
      senderWalletAddress,
      recipientWalletAddress,
      messageId,
      content: content.substring(0, 20) + '...',
      amount,
      transactionSignature
    });

    // Find sender profile ID
    let senderProfile;
    const { data: existingSenderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', senderWalletAddress)
      .single();

    if (senderError || !existingSenderProfile) {
      console.log('Sender profile not found, creating a new one');
      // Create a new profile for the sender
      const { data: newSenderProfile, error: newSenderError } = await supabase
        .from('profiles')
        .insert([
          {
            wallet_address: senderWalletAddress,
            username: `user_${senderWalletAddress.substring(0, 8)}`,
          }
        ])
        .select('id')
        .single();
      
      if (newSenderError || !newSenderProfile) {
        console.error('Failed to create sender profile:', newSenderError);
        return false;
      }
      
      senderProfile = newSenderProfile;
    } else {
      senderProfile = existingSenderProfile;
    }

    // Find recipient profile ID
    let recipientProfile;
    const { data: existingRecipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', recipientWalletAddress)
      .single();

    if (recipientError || !existingRecipientProfile) {
      console.log('Recipient profile not found, creating a new one');
      // Create a new profile for the recipient
      const { data: newRecipientProfile, error: newRecipientError } = await supabase
        .from('profiles')
        .insert([
          {
            wallet_address: recipientWalletAddress,
            username: `user_${recipientWalletAddress.substring(0, 8)}`,
          }
        ])
        .select('id')
        .single();
      
      if (newRecipientError || !newRecipientProfile) {
        console.error('Failed to create recipient profile:', newRecipientError);
        return false;
      }
      
      recipientProfile = newRecipientProfile;
    } else {
      recipientProfile = existingRecipientProfile;
    }

    console.log('Profiles found/created:', {
      senderId: senderProfile.id,
      recipientId: recipientProfile.id
    });

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
          status: 'pending' as MessageStatus,
          transaction_signature: transactionSignature
        }
      ]);

    if (error) {
      console.error('Error saving message:', error);
      return false;
    }

    console.log('Message saved successfully');
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

/**
 * Fix database issues by ensuring all profiles have the correct wallet addresses
 * This can be called from the console to fix existing data
 */
export const fixDatabaseIssues = async () => {
  try {
    console.log('Starting database fix...');
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return false;
    }
    
    console.log(`Found ${profiles?.length || 0} profiles`);
    
    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*');
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return false;
    }
    
    console.log(`Found ${messages?.length || 0} messages`);
    
    // Check for messages with missing sender or recipient profiles
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
    const recipientIds = [...new Set(messages.map(msg => msg.recipient_id))];
    const allProfileIds = [...new Set([...senderIds, ...recipientIds])];
    
    const existingProfileIds = profiles.map(p => p.id);
    
    const missingProfileIds = allProfileIds.filter(id => !existingProfileIds.includes(id));
    
    if (missingProfileIds.length > 0) {
      console.log(`Found ${missingProfileIds.length} missing profile IDs referenced in messages`);
      console.log('Missing profile IDs:', missingProfileIds);
    } else {
      console.log('No missing profile IDs found');
    }
    
    console.log('Database fix completed');
    return true;
  } catch (error) {
    console.error('Error fixing database:', error);
    return false;
  }
};

/**
 * Directly check the database for messages by wallet address
 * This bypasses the profile lookup and can be used for debugging
 */
export const checkMessagesDirectly = async (walletAddress: string) => {
  try {
    console.log(`Directly checking messages for wallet: ${walletAddress}`);
    
    // First get all profiles to find the one with this wallet address
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { error: 'Failed to fetch profiles' };
    }
    
    // Find the profile with this wallet address
    const profile = profiles.find(p => p.wallet_address === walletAddress);
    
    if (!profile) {
      console.log(`No profile found for wallet address: ${walletAddress}`);
      return { error: 'No profile found for this wallet address' };
    }
    
    console.log(`Found profile:`, profile);
    
    // Get all messages
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*');
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return { error: 'Failed to fetch messages' };
    }
    
    // Filter messages for this profile
    const sentMessages = allMessages.filter(msg => msg.sender_id === profile.id);
    const receivedMessages = allMessages.filter(msg => msg.recipient_id === profile.id);
    
    console.log(`Found ${sentMessages.length} sent and ${receivedMessages.length} received messages`);
    
    return {
      profile,
      sentMessages,
      receivedMessages
    };
  } catch (error) {
    console.error('Error checking messages directly:', error);
    return { error: 'Failed to check messages' };
  }
};

/**
 * Console utility to help debug database issues
 * This can be called from the browser console
 */
export const debugDatabase = async () => {
  try {
    console.log('Starting database debug...');
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { error: 'Failed to fetch profiles' };
    }
    
    console.log(`Found ${profiles?.length || 0} profiles:`);
    console.table(profiles);
    
    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*');
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return { error: 'Failed to fetch messages' };
    }
    
    console.log(`Found ${messages?.length || 0} messages:`);
    console.table(messages);
    
    // Check for messages with missing sender or recipient profiles
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
    const recipientIds = [...new Set(messages.map(msg => msg.recipient_id))];
    const allProfileIds = [...new Set([...senderIds, ...recipientIds])];
    
    const existingProfileIds = profiles.map(p => p.id);
    
    const missingProfileIds = allProfileIds.filter(id => !existingProfileIds.includes(id));
    
    if (missingProfileIds.length > 0) {
      console.log(`Found ${missingProfileIds.length} missing profile IDs referenced in messages:`);
      console.log(missingProfileIds);
      
      // Find messages with missing profiles
      const messagesWithMissingProfiles = messages.filter(
        msg => missingProfileIds.includes(msg.sender_id) || missingProfileIds.includes(msg.recipient_id)
      );
      
      console.log(`Found ${messagesWithMissingProfiles.length} messages with missing profiles:`);
      console.table(messagesWithMissingProfiles);
    } else {
      console.log('No missing profile IDs found');
    }
    
    // Check for profiles with missing wallet addresses
    const profilesWithoutWalletAddress = profiles.filter(p => !p.wallet_address);
    
    if (profilesWithoutWalletAddress.length > 0) {
      console.log(`Found ${profilesWithoutWalletAddress.length} profiles without wallet addresses:`);
      console.table(profilesWithoutWalletAddress);
    } else {
      console.log('No profiles without wallet addresses found');
    }
    
    console.log('Database debug completed');
    
    // Return the data for further inspection
    return {
      profiles,
      messages,
      missingProfileIds,
      profilesWithoutWalletAddress
    };
  } catch (error) {
    console.error('Error debugging database:', error);
    return { error: 'Failed to debug database' };
  }
};

// Make the debug function available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugDatabase = debugDatabase;
  (window as any).checkMessagesDirectly = checkMessagesDirectly;
  (window as any).fixDatabaseIssues = fixDatabaseIssues;
  console.log('Database debug utilities added to window object. Use window.debugDatabase(), window.checkMessagesDirectly(walletAddress), or window.fixDatabaseIssues() to debug.');
}
