
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
  if (!walletAddress) {
    console.log('No wallet address provided to fetchMessages');
    return [];
  }

  try {
    console.log(`Fetching ${type} messages for wallet: ${walletAddress}`);
    
    // Get the profile associated with this wallet address
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('wallet_address', walletAddress);
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return [];
    }
    
    if (!profileData || profileData.length === 0) {
      console.log('No profile found for wallet address:', walletAddress);
      console.log('Creating a new profile...');
      
      // Generate a UUID for the new profile
      const newProfileId = crypto.randomUUID();
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: newProfileId,
          wallet_address: walletAddress,
          username: `user_${walletAddress.substring(0, 8)}`
        })
        .select();
      
      if (createError) {
        console.error('Error creating profile:', createError);
        return [];
      }
      
      console.log('Created new profile:', newProfile);
      return []; // Return empty array as there are no messages yet for a new profile
    }
    
    // Use the first profile found (should normally be only one)
    const profile = profileData[0];
    console.log('Found profile:', profile);
    
    // Build the query based on the type
    let query = supabase
      .from('messages')
      .select(`
        id, 
        sender_id, 
        recipient_id, 
        amount, 
        created_at, 
        message_id, 
        content, 
        status, 
        transaction_signature,
        profiles!sender_id(id, username, avatar_url),
        profiles!recipient_id(id, username, avatar_url)
      `);
    
    if (type === 'received') {
      query = query.eq('recipient_id', profile.id);
    } else if (type === 'sent') {
      query = query.eq('sender_id', profile.id);
    } else {
      // For 'all', fetch both sent and received
      query = query.or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`);
    }
    
    // Add sorting by created_at (newest first)
    query = query.order('created_at', { ascending: false });
    
    const { data: messages, error: messagesError } = await query;
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return [];
    }
    
    console.log(`Found ${messages?.length || 0} messages:`, messages);
    
    // Format the messages
    const formattedMessages: MessageData[] = messages?.map(msg => {
      // Extract sender and recipient profile data
      const senderProfile = msg.profiles?.sender_id;
      const recipientProfile = msg.profiles?.recipient_id;
      
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
        senderUsername: senderProfile?.username || 'Unknown User',
        senderDisplayName: senderProfile?.username || 'Unknown User',
        senderAvatarUrl: senderProfile?.avatar_url || '',
        recipientUsername: recipientProfile?.username || 'Unknown User',
      };
    }) || [];
    
    console.log('Formatted messages:', formattedMessages);
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

    // Validate message ID format - should start with 'm' followed by alphanumeric characters
    if (!messageId || !messageId.startsWith('m') || messageId.length < 4) {
      console.error('Invalid message ID format:', messageId);
      console.error('Message ID should start with "m" followed by at least 3 characters');
      return false;
    }

    // Check if a message with this ID already exists
    const { data: existingMessage, error: checkError } = await supabase
      .from('messages')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (existingMessage) {
      console.log('Message with this ID already exists, skipping save:', messageId);
      return true; // Return true to indicate "success" since the message already exists
    }

    // If we have a transaction signature, check if a message with this signature already exists
    if (transactionSignature) {
      const { data: existingTxMessage, error: txCheckError } = await supabase
        .from('messages')
        .select('id, message_id')
        .eq('transaction_signature', transactionSignature)
        .single();

      if (existingTxMessage) {
        console.log('Message with this transaction signature already exists:', transactionSignature);
        console.log('Existing message ID:', existingTxMessage.message_id);
        return true; // Return true to indicate "success" since the message already exists
      }
    }

    // Find sender profile
    const { data: senderProfile, error: senderProfileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('wallet_address', senderWalletAddress);
    
    let senderId: string;
    
    if (!senderProfile || senderProfile.length === 0) {
      console.log('Sender profile not found, creating a new one for', senderWalletAddress);
      // Generate a UUID for the new profile
      const newSenderId = crypto.randomUUID();
      
      const { data: newSenderProfile, error: newSenderError } = await supabase
        .from('profiles')
        .insert({
          id: newSenderId,
          wallet_address: senderWalletAddress,
          username: `user_${senderWalletAddress.substring(0, 8)}`
        })
        .select();
      
      if (newSenderError || !newSenderProfile || newSenderProfile.length === 0) {
        console.error('Failed to create sender profile:', newSenderError);
        return false;
      }
      
      senderId = newSenderProfile[0].id;
      console.log('Created new sender profile with ID:', senderId);
    } else {
      senderId = senderProfile[0].id;
      console.log('Found existing sender profile:', senderProfile[0]);
    }

    // Find recipient profile
    const { data: recipientProfile, error: recipientProfileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('wallet_address', recipientWalletAddress);
    
    let recipientId: string;
    
    if (!recipientProfile || recipientProfile.length === 0) {
      console.log('Recipient profile not found, creating a new one for', recipientWalletAddress);
      
      // Generate a UUID for the new profile
      const newRecipientId = crypto.randomUUID();
      
      const { data: newRecipientProfile, error: newRecipientError } = await supabase
        .from('profiles')
        .insert({
          id: newRecipientId,
          wallet_address: recipientWalletAddress,
          username: `user_${recipientWalletAddress.substring(0, 8)}`
        })
        .select();
      
      if (newRecipientError || !newRecipientProfile || newRecipientProfile.length === 0) {
        console.error('Failed to create recipient profile:', newRecipientError);
        return false;
      }
      
      recipientId = newRecipientProfile[0].id;
      console.log('Created new recipient profile with ID:', recipientId);
    } else {
      recipientId = recipientProfile[0].id;
      console.log('Found existing recipient profile:', recipientProfile[0]);
    }

    console.log('Saving message with sender_id:', senderId, 'recipient_id:', recipientId);

    // Save the message
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId,
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

    console.log('Message saved successfully with ID:', messageId);
    
    // Verify the message was saved by fetching it back
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('messages')
      .select('*')
      .eq('message_id', messageId);
      
    if (verifyError) {
      console.error('Error verifying message was saved:', verifyError);
    } else {
      console.log('Verified message was saved:', verifyMessage);
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
    console.log(`Updating message status for message ID: ${messageId}`);
    console.log(`New status: ${status}`);
    console.log(`Transaction signature: ${transactionSignature || 'none'}`);
    
    // Validate message ID format
    if (!messageId.startsWith('m') || messageId.length < 4) {
      console.error('Invalid message ID format:', messageId);
      console.error('Message ID should start with "m" followed by at least 3 characters');
      return false;
    }
    
    // First check if the message exists
    const { data: existingMessage, error: checkError } = await supabase
      .from('messages')
      .select('id, status')
      .eq('message_id', messageId)
      .single();
    
    if (checkError) {
      console.error('Error checking for existing message:', checkError);
      return false;
    }
    
    if (!existingMessage) {
      console.error('Message not found with ID:', messageId);
      return false;
    }
    
    console.log('Found message to update:', existingMessage);
    
    // Update the message status in the database
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
    
    console.log(`Successfully updated status for message ID: ${messageId}`);
    return true;
  } catch (error) {
    console.error('Error in updateMessageStatus:', error);
    return false;
  }
};

// Global debug functions for console access
if (typeof window !== 'undefined') {
  (window as any).debugDatabase = async () => {
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
      
      return {
        profiles,
        messages
      };
    } catch (error) {
      console.error('Error debugging database:', error);
      return { error: 'Failed to debug database' };
    }
  };
}

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

export const fixMessageIds = async (): Promise<boolean> => {
  try {
    console.log('Starting message ID fix...');
    
    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*');
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return false;
    }
    
    console.log(`Found ${messages?.length || 0} messages`);
    
    // Filter messages with incorrect message_id format
    const incorrectMessages = messages.filter(msg => 
      !msg.message_id || 
      !msg.message_id.startsWith('m') || 
      msg.message_id.length < 4 ||
      msg.message_id.includes('-') // UUID format
    );
    
    console.log(`Found ${incorrectMessages.length} messages with incorrect message_id format`);
    
    if (incorrectMessages.length === 0) {
      console.log('No messages need fixing');
      return true;
    }
    
    // Process each incorrect message
    let successCount = 0;
    let failCount = 0;
    
    for (const msg of incorrectMessages) {
      try {
        // Generate a new message ID in the correct format
        const newMessageId = `m${Date.now().toString(36).slice(-3)}`;
        
        console.log(`Updating message ${msg.id}: changing message_id from "${msg.message_id}" to "${newMessageId}"`);
        
        // Update the message with the new ID
        const { error: updateError } = await supabase
          .from('messages')
          .update({ message_id: newMessageId })
          .eq('id', msg.id);
        
        if (updateError) {
          console.error(`Error updating message ${msg.id}:`, updateError);
          failCount++;
        } else {
          console.log(`Successfully updated message ${msg.id}`);
          successCount++;
        }
        
        // Add a small delay to ensure unique timestamps for message IDs
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Error processing message ${msg.id}:`, error);
        failCount++;
      }
    }
    
    console.log(`Message ID fix completed: ${successCount} updated successfully, ${failCount} failed`);
    return true;
  } catch (error) {
    console.error('Error fixing message IDs:', error);
    return false;
  }
};

// Make the debug functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugDatabase = async () => {
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
      
      return {
        profiles,
        messages
      };
    } catch (error) {
      console.error('Error debugging database:', error);
      return { error: 'Failed to debug database' };
    }
  };
  
  (window as any).checkMessagesDirectly = async (walletAddress: string) => {
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
      
      // Get all messages for this profile
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, username, avatar_url),
          recipient:profiles(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`);
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return { error: 'Failed to fetch messages' };
      }
      
      console.log(`Found ${messages.length} messages for wallet: ${walletAddress}`);
      console.table(messages);
      
      return {
        profile,
        messages
      };
    } catch (error) {
      console.error('Error checking messages directly:', error);
      return { error: 'Failed to check messages' };
    }
  };
  
  (window as any).fixDatabaseIssues = fixDatabaseIssues;
  (window as any).fixMessageIds = fixMessageIds;
  
  console.log('Database debug utilities added to window object. Use window.debugDatabase(), window.checkMessagesDirectly(walletAddress), window.fixDatabaseIssues(), or window.fixMessageIds() to debug.');
}

// Add this debug function to directly check messages for a specific wallet address
export const debugCheckMessages = async (walletAddress: string) => {
  try {
    console.log(`Debug checking messages for wallet: ${walletAddress}`);
    
    // First, get the profile ID for this wallet address
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress);
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { error: 'Failed to fetch profile' };
    }
    
    console.log('Found profiles:', profileData);
    
    if (!profileData || profileData.length === 0) {
      console.log('No profile found for this wallet address');
      return { error: 'No profile found for this wallet address' };
    }
    
    const profile = profileData[0];
    
    // Now, get all messages for this profile ID (both sent and received)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`);
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return { error: 'Failed to fetch messages' };
    }
    
    console.log(`Found ${messages.length} messages for wallet:`, walletAddress);
    console.table(messages);
    
    // Get all profiles to check relationships
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (allProfilesError) {
      console.error('Error fetching all profiles:', allProfilesError);
    } else {
      console.log('All profiles:');
      console.table(allProfiles);
    }
    
    // Check direct relationship with sender/recipient IDs
    const relatedProfileIds = new Set();
    messages.forEach(msg => {
      relatedProfileIds.add(msg.sender_id);
      relatedProfileIds.add(msg.recipient_id);
    });
    
    console.log('Related profile IDs:', [...relatedProfileIds]);
    
    // Check if the current profile is a sender or recipient in any message
    const isSender = messages.some(msg => msg.sender_id === profile.id);
    const isRecipient = messages.some(msg => msg.recipient_id === profile.id);
    
    console.log('Direct check - Is sender in any message:', isSender);
    console.log('Direct check - Is recipient in any message:', isRecipient);
    
    // Try querying directly without .single()
    console.log('Attempting direct query...');
    const { data: directData, error: directError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(id, username, avatar_url),
        recipient:profiles(id, username, avatar_url)
      `)
      .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`);
    
    if (directError) {
      console.error('Error with direct query:', directError);
    } else {
      console.log('Direct query results:', directData);
    }
    
    // Count received and sent messages
    const receivedMessages = messages.filter(msg => msg.recipient_id === profile.id);
    const sentMessages = messages.filter(msg => msg.sender_id === profile.id);
    
    console.log(`Loaded ${receivedMessages.length} received and ${sentMessages.length} sent messages`);
    
    return {
      profile,
      messages,
      stats: {
        totalMessages: messages.length,
        receivedMessages: receivedMessages.length,
        sentMessages: sentMessages.length
      }
    };
  } catch (error) {
    console.error('Error in debugCheckMessages:', error);
    return { error: 'Exception during debug check' };
  }
};

// Make all debug functions available in window for console access
if (typeof window !== 'undefined') {
  (window as any).debugDatabase = async () => {
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
      
      return {
        profiles,
        messages
      };
    } catch (error) {
      console.error('Error debugging database:', error);
      return { error: 'Failed to debug database' };
    }
  };
  
  (window as any).checkMessagesDirectly = async (walletAddress: string) => {
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
      
      // Get all messages for this profile
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, username, avatar_url),
          recipient:profiles(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`);
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return { error: 'Failed to fetch messages' };
      }
      
      console.log(`Found ${messages.length} messages for wallet: ${walletAddress}`);
      console.table(messages);
      
      return {
        profile,
        messages
      };
    } catch (error) {
      console.error('Error checking messages directly:', error);
      return { error: 'Failed to check messages' };
    }
  };
  
  (window as any).debugCheckMessages = debugCheckMessages;
  (window as any).fixDatabaseIssues = fixDatabaseIssues;
  (window as any).fixMessageIds = fixMessageIds;
  
  console.log('Database debug utilities added to window object. Use window.debugDatabase(), window.checkMessagesDirectly(walletAddress), window.debugCheckMessages(walletAddress), window.fixDatabaseIssues(), or window.fixMessageIds() to debug.');
}
