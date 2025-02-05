import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  text: string;
  isAi: boolean;
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (data) {
        setMessages(data.map(msg => ({
          text: msg.content,
          isAi: msg.is_ai || false
        })));
      }
    };

    loadMessages();
  }, [session?.user?.id]);

  const handleSendMessage = async (message: string) => {
    if (!session?.user?.id) {
      console.error('User must be logged in to send messages');
      return;
    }

    try {
      setIsLoading(true);

      // Add user message to UI and database
      const userMessage = { text: message, isAi: false };
      setMessages(prev => [...prev, userMessage]);

      await supabase.from('messages').insert({
        content: message,
        is_ai: false,
        user_id: session.user.id
      });

      // Prepare messages for AI
      const messageHistory = messages.map(msg => ({
        role: msg.isAi ? "assistant" : "user",
        content: msg.text
      }));

      messageHistory.push({
        role: "user",
        content: message
      });

      // Call AI endpoint with correct URL
      const response = await fetch(`${window.location.origin}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages: messageHistory })
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Add AI response to UI and database
      const aiMessage = { text: aiResponse, isAi: true };
      setMessages(prev => [...prev, aiMessage]);

      await supabase.from('messages').insert({
        content: aiResponse,
        is_ai: true,
        user_id: session.user.id
      });

    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-chatbg-from to-chatbg-to p-4">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Please Sign In</h2>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-chatbg-from to-chatbg-to p-4">
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-xl bg-gray-50/10 p-4 backdrop-blur-sm">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.text}
            isAi={message.isAi}
          />
        ))}
        {isLoading && (
          <div className="flex animate-pulse justify-start">
            <div className="h-8 w-8 rounded-full bg-white/30"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};