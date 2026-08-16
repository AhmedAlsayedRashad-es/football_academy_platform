import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { BackButton } from '@/components/BackButton';
import {MessageCircle, Send, Plus, Archive, Clock, 
  User, Search, Paperclip, X, ArrowLeft} from 'lucide-react';

// Translation helper
const t = (en: string, ar: string, lang: string) => lang === 'ar' ? ar : en;

export default function Messages() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: conversations, refetch: refetchConversations } = trpc.messaging.getConversations.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.messaging.getMessages.useQuery(
    { conversationId: selectedConversation || 0 },
    { enabled: !!selectedConversation }
  );
  const { data: unreadCount } = trpc.messaging.getUnreadCount.useQuery();
  const { data: availableCoaches } = trpc.messaging.getAvailableCoaches.useQuery();

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText('');
      refetchMessages();
      refetchConversations();
    },
  });

  const startConversationMutation = trpc.messaging.startConversation.useMutation({
    onSuccess: (data) => {
      setShowNewConversation(false);
      setSelectedConversation(data.conversationId);
      refetchConversations();
    },
  });

  const archiveConversationMutation = trpc.messaging.archiveConversation.useMutation({
    onSuccess: () => {
      setSelectedConversation(null);
      refetchConversations();
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-refresh messages every 10 seconds
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        refetchMessages();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation, refetchMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      messageText: messageText.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations?.filter(conv =>
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.parentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.coachName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations?.find(c => c.id === selectedConversation);

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            
            <BackButton />
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('Messages', 'الرسائل', language)}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('Communicate with coaches and parents', 'تواصل مع المدربين وأولياء الأمور', language)}
            </p>
          </div>
          <Button
            onClick={() => setShowNewConversation(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('New Message', 'رسالة جديدة', language)}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1 p-4 h-[calc(100vh-250px)] flex flex-col">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder={t('Search conversations...', 'البحث في المحادثات...', language)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredConversations?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('No conversations yet', 'لا توجد محادثات بعد', language)}</p>
                </div>
              )}

              {filteredConversations?.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conv.id
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold text-sm truncate">
                          {conv.parentName || conv.coachName}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {conv.subject}
                      </p>
                      {conv.playerName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('About:', 'حول:', language)} {conv.playerName}
                        </p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {conv.lastMessageAt && new Date(conv.lastMessageAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 flex flex-col h-[calc(100vh-250px)]">
            {selectedConv ? (
              <>
                {/* Conversation Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedConv.subject}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedConv.parentName || selectedConv.coachName}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveConversationMutation.mutate({ conversationId: selectedConv.id })}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    {t('Archive', 'أرشفة', language)}
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages?.map((msg) => {
                    const isOwnMessage = msg.senderUserId === selectedConv.parentUserId || msg.senderUserId === selectedConv.coachUserId;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                          <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>
                          {msg.attachmentUrl && (
                            <div className="mt-2 p-2 bg-white/10 rounded">
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline flex items-center gap-1"
                              >
                                <Paperclip className="w-3 h-3" />
                                {t('Attachment', 'مرفق', language)}
                              </a>
                            </div>
                          )}
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('Type your message...', 'اكتب رسالتك...', language)}
                      className="flex-1 min-h-[60px] max-h-[120px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">
                    {t('Select a conversation', 'اختر محادثة', language)}
                  </p>
                  <p className="text-sm mt-2">
                    {t('Choose a conversation from the list or start a new one', 'اختر محادثة من القائمة أو ابدأ محادثة جديدة', language)}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {t('New Conversation', 'محادثة جديدة', language)}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewConversation(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <NewConversationForm
                coaches={availableCoaches || []}
                onSubmit={(data) => startConversationMutation.mutate(data)}
                onCancel={() => setShowNewConversation(false)}
                language={language}
              />
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

// New Conversation Form Component
function NewConversationForm({
  coaches,
  onSubmit,
  onCancel,
  language,
}: {
  coaches: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  language: string;
}) {
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject || !message) return;

    onSubmit({
      recipientUserId: parseInt(recipientId),
      subject,
      initialMessage: message,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('Select Coach', 'اختر المدرب', language)}
        </label>
        <select
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          required
        >
          <option value="">
            {t('-- Select a coach --', '-- اختر مدرباً --', language)}
          </option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name || coach.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('Subject', 'الموضوع', language)}
        </label>
        <Input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t('What is this about?', 'ما هو الموضوع؟', language)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('Message', 'الرسالة', language)}
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('Type your message...', 'اكتب رسالتك...', language)}
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('Cancel', 'إلغاء', language)}
        </Button>
        <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
          {t('Send', 'إرسال', language)}
        </Button>
      </div>
    </form>
  );
}
