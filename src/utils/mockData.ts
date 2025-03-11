
// Mock user data
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  walletAddress?: string;
  isConnected?: boolean;
}

// Mock message data
export interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl: string;
  recipientId: string;
  recipientUsername: string;
  content: string;
  paymentAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  timestamp: string;
  transactionId?: string;
}

// Mock transaction data
export interface Transaction {
  id: string;
  messageId?: string;
  senderId: string;
  recipientId: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  type: 'send' | 'receive' | 'refund' | 'donation';
  timestamp: string;
}

// Current mock user
export const currentUser: User = {
  id: 'user-1',
  username: 'cryptouser',
  displayName: 'Crypto User',
  avatarUrl: 'https://i.pravatar.cc/150?img=1',
  walletAddress: '7eG...4xP',
  isConnected: true
};

// Mock users
export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    username: 'sonicfan',
    displayName: 'Sonic Fan',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 'user-3',
    username: 'blockchaindev',
    displayName: 'Blockchain Dev',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 'user-4',
    username: 'solanabuilder',
    displayName: 'Solana Builder',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: 'user-5',
    username: 'cryptoartist',
    displayName: 'Crypto Artist',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  },
];

// Mock messages
export const messages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'user-2',
    senderUsername: 'sonicfan',
    senderDisplayName: 'Sonic Fan',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=2',
    recipientId: 'user-1',
    recipientUsername: 'cryptouser',
    content: 'Hey! I saw your post about the new sonic token. I\'d love to discuss some potential collaboration opportunities with you.',
    paymentAmount: 5,
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
    transactionId: 'tx-1',
  },
  {
    id: 'msg-2',
    senderId: 'user-3',
    senderUsername: 'blockchaindev',
    senderDisplayName: 'Blockchain Dev',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=3',
    recipientId: 'user-1',
    recipientUsername: 'cryptouser',
    content: 'I\'ve been following your work on Solana and I think you might be interested in a new project I\'m working on. Let\'s connect!',
    paymentAmount: 10,
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    transactionId: 'tx-2',
  },
  {
    id: 'msg-3',
    senderId: 'user-4',
    senderUsername: 'solanabuilder',
    senderDisplayName: 'Solana Builder',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=4',
    recipientId: 'user-1',
    recipientUsername: 'cryptouser',
    content: 'Hello! I\'m organizing a hackathon focused on Solana and Sonic projects. Would you be interested in being a judge or mentor?',
    paymentAmount: 15,
    status: 'approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    transactionId: 'tx-3',
  },
  {
    id: 'msg-4',
    senderId: 'user-5',
    senderUsername: 'cryptoartist',
    senderDisplayName: 'Crypto Artist',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=5',
    recipientId: 'user-1',
    recipientUsername: 'cryptouser',
    content: 'Hi there! I\'ve created some artwork inspired by the Sonic ecosystem and I thought you might be interested in collaborating on an NFT project.',
    paymentAmount: 7.5,
    status: 'rejected',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    transactionId: 'tx-4',
  },
  {
    id: 'msg-5',
    senderId: 'user-1',
    senderUsername: 'cryptouser',
    senderDisplayName: 'Crypto User',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=1',
    recipientId: 'user-2',
    recipientUsername: 'sonicfan',
    content: 'Hey Sonic Fan, I have some ideas about the sonic token ecosystem I\'d like to share with you. Would love to chat!',
    paymentAmount: 12,
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
    transactionId: 'tx-5',
  },
];

// Mock transactions
export const transactions: Transaction[] = [
  {
    id: 'tx-1',
    messageId: 'msg-1',
    senderId: 'user-2',
    recipientId: 'user-1',
    amount: 5,
    status: 'pending',
    type: 'receive',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
  },
  {
    id: 'tx-2',
    messageId: 'msg-2',
    senderId: 'user-3',
    recipientId: 'user-1',
    amount: 10,
    status: 'pending',
    type: 'receive',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: 'tx-3',
    messageId: 'msg-3',
    senderId: 'user-4',
    recipientId: 'user-1',
    amount: 15,
    status: 'completed',
    type: 'receive',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'tx-4',
    messageId: 'msg-4',
    senderId: 'user-5',
    recipientId: 'user-1',
    amount: 7.5,
    status: 'refunded',
    type: 'refund',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'tx-5',
    messageId: 'msg-5',
    senderId: 'user-1',
    recipientId: 'user-2',
    amount: 12,
    status: 'pending',
    type: 'send',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
  },
];

// Helper functions
export const getMessagesByUser = (userId: string, type: 'sent' | 'received') => {
  if (type === 'sent') {
    return messages.filter(message => message.senderId === userId);
  } else {
    return messages.filter(message => message.recipientId === userId);
  }
};

export const getTransactionsByUser = (userId: string) => {
  return transactions.filter(
    transaction => transaction.senderId === userId || transaction.recipientId === userId
  );
};

export const formatAmount = (amount: number) => {
  return `${amount.toFixed(2)} sonicSOL`;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'approved':
    case 'completed':
      return 'bg-green-500/10 text-green-600 border-green-500/30';
    case 'rejected':
    case 'refunded':
      return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'expired':
    case 'failed':
      return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
    default:
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
  }
};
