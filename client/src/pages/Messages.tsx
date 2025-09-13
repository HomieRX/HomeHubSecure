import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus, 
  MoreVertical,
  Archive,
  Trash2,
  Star,
  Reply
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'contractor' | 'support' | 'member';
  receiverId: string;
  subject: string;
  content: string;
  isRead: boolean;
  threadId?: string;
  attachments?: string[];
  createdAt: Date;
  isStarred?: boolean;
  isArchived?: boolean;
}

interface Thread {
  id: string;
  subject: string;
  participants: string[];
  lastMessage: Date;
  messageCount: number;
  isRead: boolean;
}

export default function Messages() {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: ''
  });

  // Mock data - in real app this would come from API
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'contractor-1',
      senderName: 'John Smith',
      senderRole: 'contractor',
      receiverId: 'user-1',
      subject: 'HVAC Service Completed',
      content: 'Hi there! I wanted to let you know that the HVAC maintenance service has been completed successfully. The system is running efficiently and I\'ve replaced the air filter as discussed. Please let me know if you have any questions.',
      isRead: false,
      threadId: 'thread-1',
      createdAt: new Date(2025, 8, 13, 10, 30),
      isStarred: true
    },
    {
      id: '2',
      senderId: 'support-1',
      senderName: 'HomeHub Support',
      senderRole: 'support',
      receiverId: 'user-1',
      subject: 'Welcome to HomeHERO Membership!',
      content: 'Congratulations on upgrading to HomeHERO membership! You now have access to priority scheduling, extended warranties, and exclusive member discounts. Your loyalty points have been updated and you can start using your new benefits immediately.',
      isRead: false,
      threadId: 'thread-2',
      createdAt: new Date(2025, 8, 12, 15, 45),
    },
    {
      id: '3',
      senderId: 'contractor-2',
      senderName: 'Mike Johnson',
      senderRole: 'contractor',
      receiverId: 'user-1',
      subject: 'Plumbing Appointment Confirmation',
      content: 'This is to confirm your plumbing appointment scheduled for tomorrow at 1:00 PM. I\'ll be addressing the kitchen sink leak we discussed. I have all the necessary parts and expect the repair to take about 2 hours.',
      isRead: true,
      threadId: 'thread-3',
      createdAt: new Date(2025, 8, 11, 9, 15),
    },
    {
      id: '4',
      senderId: 'user-1',
      senderName: 'You',
      senderRole: 'member',
      receiverId: 'contractor-2',
      subject: 'Re: Plumbing Appointment Confirmation',
      content: 'Perfect, thank you for confirming. I\'ll make sure to be available tomorrow afternoon. Should I prepare anything specific before you arrive?',
      isRead: true,
      threadId: 'thread-3',
      createdAt: new Date(2025, 8, 11, 11, 30),
    }
  ]);

  const threads = messages.reduce((acc, message) => {
    const threadId = message.threadId || message.id;
    if (!acc[threadId]) {
      acc[threadId] = {
        id: threadId,
        subject: message.subject,
        participants: [message.senderName],
        lastMessage: message.createdAt,
        messageCount: 1,
        isRead: message.isRead
      };
    } else {
      acc[threadId].lastMessage = new Date(Math.max(acc[threadId].lastMessage.getTime(), message.createdAt.getTime()));
      acc[threadId].messageCount++;
      if (!message.isRead) acc[threadId].isRead = false;
      if (!acc[threadId].participants.includes(message.senderName)) {
        acc[threadId].participants.push(message.senderName);
      }
    }
    return acc;
  }, {} as Record<string, Thread>);

  const threadList = Object.values(threads).sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());

  const getThreadMessages = (threadId: string) => {
    return messages
      .filter(msg => (msg.threadId || msg.id) === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  };

  const markThreadAsRead = (threadId: string) => {
    setMessages(prev => prev.map(msg => 
      (msg.threadId || msg.id) === threadId ? { ...msg, isRead: true } : msg
    ));
  };

  const sendReply = (threadId: string) => {
    if (!replyContent.trim()) return;

    const thread = threads[threadId];
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: 'user-1',
      senderName: 'You',
      senderRole: 'member',
      receiverId: 'contractor-1', // This would be determined based on thread
      subject: `Re: ${thread.subject}`,
      content: replyContent,
      isRead: true,
      threadId: threadId,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setReplyContent('');
  };

  const sendNewMessage = () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content) return;

    const msg: Message = {
      id: Date.now().toString(),
      senderId: 'user-1',
      senderName: 'You',
      senderRole: 'member',
      receiverId: newMessage.to,
      subject: newMessage.subject,
      content: newMessage.content,
      isRead: true,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage({ to: '', subject: '', content: '' });
    setIsComposeOpen(false);
  };

  const getSenderRoleColor = (role: string) => {
    switch (role) {
      case 'contractor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'support':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredThreads = threadList.filter(thread =>
    searchQuery === '' || 
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Communicate with contractors and support</p>
        </div>
        
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-compose-message">
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Send a message to a contractor or support team.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">To</label>
                <Input
                  value={newMessage.to}
                  onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                  placeholder="Enter recipient"
                  data-testid="input-message-to"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Message subject"
                  data-testid="input-message-subject"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  placeholder="Type your message..."
                  rows={5}
                  data-testid="input-message-content"
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={sendNewMessage} data-testid="button-send-message">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Message List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Conversations</CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-messages"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-1 p-3">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent
                      ${selectedThread === thread.id ? 'bg-accent' : ''}
                      ${!thread.isRead ? 'bg-accent/50' : ''}
                    `}
                    onClick={() => {
                      setSelectedThread(thread.id);
                      markThreadAsRead(thread.id);
                    }}
                    data-testid={`thread-${thread.id}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm truncate pr-2">{thread.subject}</div>
                      {!thread.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {thread.participants.join(', ')}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(thread.lastMessage, 'MMM d, h:mm a')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {thread.messageCount}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2">
          {selectedThread ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{threads[selectedThread]?.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {threads[selectedThread]?.participants.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" data-testid="button-star-thread">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" data-testid="button-archive-thread">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" data-testid="button-delete-thread">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ScrollArea className="h-[calc(100vh-450px)]">
                  <div className="space-y-4 pr-4">
                    {getThreadMessages(selectedThread).map((message, index) => (
                      <div key={message.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-xs font-medium">
                              {message.senderName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{message.senderName}</span>
                              <Badge className={getSenderRoleColor(message.senderRole)}>
                                {message.senderRole}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(message.createdAt, 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-10 p-3 bg-accent/30 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        {index < getThreadMessages(selectedThread).length - 1 && (
                          <Separator className="ml-10" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Reply Section */}
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      data-testid="input-reply-content"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => sendReply(selectedThread)}
                        disabled={!replyContent.trim()}
                        data-testid="button-send-reply"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}