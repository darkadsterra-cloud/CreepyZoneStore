import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import logoImg from "@assets/WhatsApp-Image-2026-04-05-at-2.43.53-PM_1775551028444.jpg";

const FAQS = [
  { keys: ["format", "obs", "software", "streamlabs", "xsplit"], answer: "All overlays come as PNG/WebM files fully compatible with OBS Studio, Streamlabs, and XSplit. Each pack includes a setup guide." },
  { keys: ["commercial", "license", "twitch", "youtube"], answer: "Yes — every purchase includes a full commercial streaming license valid for Twitch, YouTube, TikTok, Kick, and all major platforms." },
  { keys: ["download", "order", "access", "file"], answer: "After purchase, go to My Orders in the top navigation. You'll find a Download button for each product in your order history." },
  { keys: ["refund", "return", "money back"], answer: "Due to the digital nature of our products, all sales are final. If you encounter technical issues, contact us at support@creepyzone.store and we'll help you out." },
  { keys: ["price", "cost", "how much", "payment"], answer: "Our prices vary by product — overlays start from $4.99, bundles from $14.99. Payment options and details are managed by the store admin." },
  { keys: ["login", "register", "account", "sign"], answer: "Click the 'Enter' button in the top right to log in, or 'Join the Darkness' to create a new account. It's free to register!" },
];

const DEFAULTS = [
  "Welcome to CreepyZone Store. The darkness is our domain. What do you seek, soul?",
  "I can help with product info, downloads, accounts, and anything CreepyZone. What do you need?",
  "Browse our catalog of horror overlays, alerts, and bundles — crafted for streamers who embrace the dark.",
];

interface Message { id: number; text: string; isUser: boolean; }

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: DEFAULTS[0], isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();
    for (const faq of FAQS) {
      if (faq.keys.some(k => lower.includes(k))) return faq.answer;
    }
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return "Greetings, soul. Welcome to CreepyZone Store — the darkest streaming marketplace. How can I guide you?";
    }
    if (lower.includes("about") || lower.includes("who are")) {
      return "CreepyZone Store is a premium horror digital asset marketplace for streamers. We craft dark overlays, alerts, bundles, and more. Founded in 2024, built for the dark side of content creation.";
    }
    if (lower.includes("help") || lower.includes("support")) {
      return "For support, email us at support@creepyzone.store. You can also browse our FAQ or check the About page for more details.";
    }
    return DEFAULTS[Math.floor(Math.random() * DEFAULTS.length)];
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), text: input, isUser: true };
    const response = getResponse(input);
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: response, isUser: false }]);
    }, 900 + Math.random() * 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-80 border border-purple-900/40 bg-black/95 backdrop-blur-md overflow-hidden"
            style={{ boxShadow: "0 0 30px rgba(100,0,180,0.25), 0 0 60px rgba(180,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-900/30 bg-purple-950/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={logoImg} alt="CreepyZone" className="w-9 h-9 rounded-full object-cover border border-purple-600/50" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border border-black animate-pulse" />
                </div>
                <div>
                  <span className="font-creepster text-white text-base">Dark Assistant</span>
                  <p className="text-xs text-green-400">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-56 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.isUser ? "justify-end" : "justify-start"}`}>
                  {!msg.isUser && (
                    <img src={logoImg} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1 border border-purple-700/50" />
                  )}
                  <div className={`max-w-[80%] px-3 py-2 text-sm ${
                    msg.isUser
                      ? "bg-red-800/40 text-white border border-red-700/30"
                      : "bg-card border border-purple-900/30 text-gray-300"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <img src={logoImg} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1 border border-purple-700/50" />
                  <div className="bg-card border border-purple-900/30 px-3 py-2 text-sm text-gray-500 flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {["Download help", "Formats?", "Pricing?", "Refund policy"].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="flex-shrink-0 text-xs px-3 py-1 border border-purple-900/40 text-purple-400 hover:bg-purple-950/30 transition-all whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex p-4 gap-2 border-t border-purple-900/20">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask the darkness..."
                className="flex-1 px-3 py-2 bg-background border border-purple-900/30 focus:border-purple-600 outline-none text-white text-sm"
              />
              <button onClick={handleSend}
                className="p-2 bg-red-700 hover:bg-red-600 text-white border border-red-500 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button with Logo */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-purple-700/70 flex items-center justify-center"
        style={{ boxShadow: "0 0 20px rgba(128,0,255,0.5), 0 0 40px rgba(180,0,0,0.2)" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: isOpen 
          ? "0 0 20px rgba(128,0,255,0.5)" 
          : ["0 0 20px rgba(128,0,255,0.5)", "0 0 35px rgba(128,0,255,0.8), 0 0 60px rgba(180,0,0,0.3)", "0 0 20px rgba(128,0,255,0.5)"]
        }}
        transition={isOpen ? {} : { repeat: Infinity, duration: 2 }}
      >
        <img src={logoImg} alt="Chat" className="w-full h-full object-cover" />
        {!isOpen && (
          <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
            <span className="text-white text-[8px] font-bold uppercase tracking-wider">Help</span>
          </div>
        )}
        {isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </div>
        )}
        {/* Online dot */}
        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-black animate-pulse" />
      </motion.button>
    </div>
  );
}
