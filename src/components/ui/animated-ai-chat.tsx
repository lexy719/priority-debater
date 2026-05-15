"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  CircleUserRound,
  Command,
  ImageIcon,
  LoaderIcon,
  MonitorIcon,
  Paperclip,
  SendIcon,
  Sparkles,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-[--line] bg-[--surface-1] px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out placeholder:text-[--ink-3]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          {...props}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
        />

        {showRing && isFocused && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-[--accent-ring] ring-offset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export function AnimatedAIChat() {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [inputFocused, setInputFocused] = useState(false);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 68,
    maxHeight: 210,
  });

  const commandSuggestions = React.useMemo<CommandSuggestion[]>(
    () => [
      {
        icon: <Sparkles className="h-4 w-4" />,
        label: "Debate idea",
        description: "Start the five-persona debate",
        prefix: "/debate",
      },
      {
        icon: <Command className="h-4 w-4" />,
        label: "Ask skeptic",
        description: "Pressure-test the weakest assumption",
        prefix: "/skeptic",
      },
      {
        icon: <MonitorIcon className="h-4 w-4" />,
        label: "Find proof",
        description: "Turn objections into validation tests",
        prefix: "/proof",
      },
      {
        icon: <ImageIcon className="h-4 w-4" />,
        label: "Review landing",
        description: "Use a screenshot as evidence",
        prefix: "/review",
      },
    ],
    []
  );

  const paletteFromValue = value.startsWith("/") && !value.includes(" ");
  const matchingSuggestionIndex = React.useMemo(
    () => commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(value)),
    [commandSuggestions, value]
  );
  const showCommandPalette = commandPaletteOpen || paletteFromValue;
  const selectedSuggestionIndex =
    activeSuggestion >= 0 ? activeSuggestion : matchingSuggestionIndex >= 0 ? matchingSuggestionIndex : -1;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-command-button]");

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
                setCommandPaletteOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setValue(`${selectedCommand.prefix} `);
    setCommandPaletteOpen(false);
    setActiveSuggestion(-1);
    setRecentCommand(selectedCommand.label);
    setTimeout(() => setRecentCommand(null), 2200);
  };

  const handleSendMessage = () => {
    if (!value.trim()) return;

    startTransition(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setValue("");
        adjustHeight(true);
      }, 2400);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion((prev) => {
          const current = prev >= 0 ? prev : selectedSuggestionIndex;
          return current < commandSuggestions.length - 1 ? current + 1 : 0;
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion((prev) => {
          const current = prev >= 0 ? prev : selectedSuggestionIndex;
          return current > 0 ? current - 1 : commandSuggestions.length - 1;
        });
      } else if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        if (selectedSuggestionIndex >= 0) selectCommandSuggestion(selectedSuggestionIndex);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setCommandPaletteOpen(false);
        setActiveSuggestion(-1);
      }
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachFile = () => {
    const mockFileName = `brief-${Math.floor(Math.random() * 1000)}.pdf`;
    setAttachments((prev) => [...prev, mockFileName]);
  };

  return (
    <div className="lab-bg relative w-full overflow-visible text-[--ink-0]">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-80 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-[--accent]/16 blur-[110px]" />
        <div className="absolute right-1/4 top-10 h-72 w-72 rounded-full bg-[--go]/10 blur-[110px]" />
      </div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-4xl space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="relative overflow-hidden rounded-[24px] border-2 border-[--ink-0] bg-[--bg] text-[--ink-0] shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatePresence>
            {showCommandPalette && (
              <motion.div
                ref={commandPaletteRef}
                className="absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-2xl border-2 border-[--ink-0] bg-[--bg] shadow-2xl"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                <div className="bg-[--bg] py-1">
                  {commandSuggestions.map((suggestion, index) => (
                    <motion.button
                      type="button"
                      key={suggestion.prefix}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                        selectedSuggestionIndex === index
                          ? "bg-[--ink-0] text-[--bg]"
                          : "text-[--ink-2] hover:bg-[--surface-2]"
                      )}
                      onClick={() => selectCommandSuggestion(index)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="flex h-5 w-5 items-center justify-center text-[--ink-0]">
                        {suggestion.icon}
                      </div>
                      <div>
                        <div className="font-medium text-[--ink-0]">{suggestion.label}</div>
                        <div className="text-[--ink-2]">{suggestion.description}</div>
                      </div>
                      <div className="ml-auto font-mono text-[--ink-2]">{suggestion.prefix}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-3 md:p-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Describe your startup idea..."
              containerClassName="w-full"
              className="min-h-[64px] w-full resize-none border-none bg-transparent px-4 py-3 pr-3 text-base text-[--ink-1] placeholder:text-[--ink-3] focus:outline-none"
              style={{ overflow: "hidden" }}
              showRing={false}
            />
          </div>

          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2 px-4 pb-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {attachments.map((file, index) => (
                  <motion.div
                    key={`${file}-${index}`}
                    className="flex items-center gap-2 rounded-lg bg-[--surface-2] px-3 py-1.5 text-xs text-[--ink-0]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <span>{file}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                      className="text-[--ink-2] transition-colors hover:text-[--ink-0]"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-4 border-t-2 border-[--ink-0] p-3 md:p-4">
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={handleAttachFile}
                whileTap={{ scale: 0.94 }}
                className="rounded-lg p-2 text-[--ink-1] transition-colors hover:bg-[--surface-2] hover:text-[--ink-0]"
                aria-label="Attach brief"
              >
                <Paperclip className="h-4 w-4" />
              </motion.button>
              <motion.button
                type="button"
                data-command-button
                onClick={(event) => {
                  event.stopPropagation();
                  setCommandPaletteOpen((prev) => !prev);
                }}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "rounded-lg p-2 text-[--ink-1] transition-colors hover:bg-[--surface-2] hover:text-[--ink-0]",
                  showCommandPalette && "bg-[--surface-2] text-[--ink-0]"
                )}
                aria-label="Open commands"
              >
                <Command className="h-4 w-4" />
              </motion.button>
            </div>

            <motion.button
              type="button"
              onClick={handleSendMessage}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isTyping || !value.trim()}
              className={cn(
                "flex items-center gap-2 rounded-[16px] px-5 py-3 text-sm font-semibold transition-all",
                value.trim()
                  ? "bg-[--ink-0] text-[--bg] shadow-lg shadow-black/25"
                  : "border-2 border-[--ink-0] bg-[--bg] text-[--ink-0]"
              )}
            >
              {isTyping ? (
                <LoaderIcon className="h-4 w-4 animate-[spin_2s_linear_infinite]" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
              <span>Debate</span>
            </motion.button>
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {commandSuggestions.map((suggestion, index) => (
            <motion.button
              type="button"
              key={suggestion.prefix}
              onClick={() => selectCommandSuggestion(index)}
              className="relative flex items-center gap-2 rounded-full border-2 border-[#000] bg-[#4b9be3] px-3 py-2 text-sm text-[#000] shadow-[2px_2px_0_0_#000] transition-all hover:bg-[#d1e7f5] hover:shadow-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              {suggestion.icon}
              <span>{suggestion.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {isTyping && (
          <motion.div
            className="absolute -bottom-14 left-1/2 z-20 -translate-x-1/2 rounded-full border-2 border-[--ink-0] bg-[--bg] px-4 py-2 shadow-[2px_2px_0_0_var(--ink-0)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-8 items-center justify-center rounded-full bg-[--surface-2]">
                <CircleUserRound className="h-4 w-4 text-[--ink-0]" />
              </div>
              <div className="flex items-center gap-2 text-sm text-[--ink-1]">
                <span>Panel is debating</span>
                <TypingDots />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {recentCommand && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full border-2 border-[--ink-0] bg-[--bg] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[--ink-1]">
          {recentCommand} selected
        </div>
      )}

      {inputFocused && (
        <motion.div
          className="pointer-events-none fixed z-0 h-[50rem] w-[50rem] rounded-full bg-gradient-to-r from-[--accent] via-[--no-go] to-[--go] opacity-[0.025] blur-[96px]"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="ml-1 flex items-center">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="mx-0.5 h-1.5 w-1.5 rounded-full bg-[--ink-0]"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
          style={{ boxShadow: "0 0 4px rgba(0, 0, 0, 0.2)" }}
        />
      ))}
    </div>
  );
}
