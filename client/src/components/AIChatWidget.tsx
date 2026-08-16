import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { Streamdown } from "@/components/MarkdownRenderer";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  currentPage?: string;
  relevantData?: any;
  initialPrompt?: string;
  compact?: boolean;
}

export function AIChatWidget({ 
  currentPage, 
  relevantData, 
  initialPrompt,
  compact = false 
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [contextId, setContextId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create AI context on mount
  const createContextMutation = trpc.ai.createContext.useMutation({
    onSuccess: (data) => {
      setContextId(data.contextId);
    },
  });

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          // response may arrive as structured content blocks rather than text.
          content: typeof data.response === "string" ? data.response : JSON.stringify(data.response ?? ""),
          timestamp: new Date(),
        },
      ]);
      scrollToBottom();
    },
    onError: (error) => {
      toast.error(`AI Error: ${error.message}`);
    },
  });

  useEffect(() => {
    if (isOpen && !contextId) {
      createContextMutation.mutate();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial prompt if provided
  useEffect(() => {
    if (isOpen && initialPrompt && messages.length === 0 && contextId) {
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt, contextId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        role: "user",
        content: text,
        timestamp: new Date(),
      },
    ]);

    // Send to AI
    chatMutation.mutate({
      message: text,
      contextId: contextId || undefined,
      currentPage,
      relevantData,
    });

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 w-80 shadow-lg z-50">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">AI Assistant</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`fixed ${compact ? 'bottom-6 right-6 w-96' : 'bottom-6 right-6 w-[32rem]'} h-[600px] shadow-lg z-50 flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">AI Assistant</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">AI Assistant Ready</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ask me anything about player performance, training, tactics, nutrition, or any other aspect of football coaching.
              </p>
              <div className="space-y-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => handleSend("Analyze the top performers this month")}
                >
                  Analyze top performers
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => handleSend("Suggest training drills for improving passing accuracy")}
                >
                  Suggest training drills
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => handleSend("Create a match strategy for our next game")}
                >
                  Create match strategy
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Streamdown>{message.content}</Streamdown>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={chatMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || chatMutation.isPending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
