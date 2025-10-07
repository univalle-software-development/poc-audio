"use client";

import { ChatMessage } from "@/components/chat-message";
import TextareaAutosize from "react-textarea-autosize";
import { Inter } from "next/font/google";
import { KeyboardEvent, useRef, useEffect, useState } from "react";
import { useConvexChat, ConvexChatProvider } from "@/components/convex-chat-provider";
import { Message } from "ai";
import Image from "next/image";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { LoadingDots } from "@/components/loading-dots";

const inter = Inter({ subsets: ["latin"] });

// Model display names
const MODEL_NAMES: Record<string, string> = {
  openai: "OpenAI",
  // claude: "Anthropic Claude", // Removed
  // grok: "Grok",               // Removed
};

// Wrapper component that includes the provider
export function Chat() {
  return (
    <ConvexChatProvider>
      <ChatInner />
    </ConvexChatProvider>
  );
}

// Inner component that uses the context
function ChatInner() {
  const {
    input,
    handleInputChange,
    handleSubmit,
    handleClearChat,
    isLoading,
    isClearing,
    convexMessages,
    // selectedModel,        // Removed
    // setSelectedModel,    // Removed
    // availableModels,     // Removed
    // lastModelCommand,    // Removed
  } = useConvexChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Speech-to-text hook
  const {
    isRecording,
    isTranscribing,
    transcript,
    error: speechError,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useSpeechToText();

  // const [showModelSelector, setShowModelSelector] = useState(false); // Removed

  // Convert Convex messages to AI Message format for ChatMessage component
  const allMessages: Message[] = convexMessages
    .map((msg: any) => ({
      id: msg._id,
      // Ensure role is valid for Message type
      role:
        msg.role === "user" ||
          msg.role === "assistant" ||
          msg.role === "system" ||
          msg.role === "function" ||
          msg.role === "tool"
          ? msg.role
          : "assistant",
      content: msg.text || msg.content || "",
      createdAt: new Date(msg.createdAt || msg._creationTime),
      // Add parentId if it exists for threading
      parentId: msg.parentId,
    }))
    .filter((msg: any) => msg.content.trim() !== "") // Filter out empty messages
    .sort((a: any, b: any) => a.createdAt - b.createdAt);

  useEffect(() => {
    console.log("Messages from Convex:", convexMessages);
    console.log("Processed messages for display:", allMessages);
  }, [convexMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Skip auto-scrolling on initial page load
    if (initialLoad) {
      setInitialLoad(false);
      return;
    }

    // Only scroll on subsequent message changes
    if (allMessages.length > 0) {
      scrollToBottom();
    }
  }, [allMessages, initialLoad]);

  // Update input when transcript is available
  useEffect(() => {
    if (transcript) {
      // Update the input with the transcript
      handleInputChange({ target: { value: transcript } } as any);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Show error if speech recognition fails
  useEffect(() => {
    if (speechError) {
      console.error("Speech-to-text error:", speechError);
      // You could show a toast notification here
    }
  }, [speechError]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  // const handleModelChange = async (model: string) => { // Removed
  //   await setSelectedModel(model);
  //   setShowModelSelector(false);
  // };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className={`flex flex-col h-full ${inter.className}`}>
      <div className="mx-auto  w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col h-full">
        <div className="mx-auto w-full max-w-3xl flex flex-col h-full py-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 w-full">
            {/* Logo */}
            <div className="flex items-center gap-1">
              <Image
                src="/golangers.webp"
                width={40}
                height={40}
                alt="Golangers Logo"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  userSelect: 'none',
                  pointerEvents: 'auto'
                }}
              />
              <h1 className="font-serif italic">
                POC Audio - Cloud Speech-to-Text
              </h1>
            </div>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              disabled={isLoading || isClearing || convexMessages.length === 0}
              className="p-3 rounded-full bg-red-400 shadow text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isClearing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {/* Clearing... */}
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-trash-2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>

                </>
              )}
            </button>
          </div>

          {/* Chat Container */}
          <div className="w-full min-w-full flex-1 divide-y ring-2 ring-gray-100 divide-gray-200 overflow-hidden rounded-lg backdrop-blur-sm shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10 flex flex-col">
            {/* Messages area */}
            <div className="w-full px-4 py-5 sm:p-6 flex-1 overflow-hidden">
              <div
                ref={chatContainerRef}
                className="h-full overflow-y-auto">
                {allMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message as Message}
                    messages={allMessages as Message[]}
                  />
                ))}

                {/* AI is thinking indicator */}
                {isLoading && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      AI
                    </div>
                    <div className="flex-1 pt-1">
                      <LoadingDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="px-4 py-4 sm:px-6">
              <form onSubmit={handleSubmit} className="relative">
                {/* Transcribing indicator */}
                {isTranscribing && (
                  <div className="absolute -top-10 left-4 bg-zinc-100 px-3 py-2 rounded-full shadow-sm flex items-center gap-2 text-sm text-zinc-600">
                    <LoadingDots />
                    <span>Transcribing audio...</span>
                  </div>
                )}

                <div
                  className="w-full min-h-[60px] cursor-text rounded-chat flex items-center gap-2"
                  onClick={(e) => {
                    const textarea = e.currentTarget.querySelector("textarea");
                    if (textarea && e.target === e.currentTarget) textarea.focus();
                  }}>
                  <TextareaAutosize
                    className="flex-1 resize-none px-4 py-3 text-base focus-visible:outline-none disabled:opacity-50 rounded-chat"
                    placeholder="Send a message..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    maxRows={4}
                  />
                  <button
                    type="button"
                    onClick={handleRecordingToggle}
                    disabled={isLoading}
                    className={`mr-3 p-2.5 rounded-full transition-all duration-200 ease-in-out ${isRecording
                      ? "bg-red-500 hover:bg-red-600 shadow-lg scale-110"
                      : "bg-zinc-100 hover:bg-zinc-200 hover:shadow-md"
                      } disabled:opacity-50 disabled:cursor-not-allowed group`}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}>
                    {isRecording ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="animate-pulse">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-zinc-600 group-hover:text-zinc-800 transition-colors">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
