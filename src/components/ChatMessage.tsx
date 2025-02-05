import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isAi: boolean;
}

export const ChatMessage = ({ message, isAi }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex w-full animate-message-fade-in",
        isAi ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
          isAi
            ? "bg-white text-gray-800 shadow-sm"
            : "bg-blue-600 text-white shadow-md"
        )}
      >
        {message}
      </div>
    </div>
  );
};