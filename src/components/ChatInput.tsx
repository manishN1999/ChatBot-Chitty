import { Send } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-xl bg-white p-2 shadow-lg"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 border-none bg-transparent px-2 py-1 focus:outline-none"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
};