import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Send } from "lucide-react";

const FAQS: Array<{ question: string; answer: string }> = [
  { question: "What formats are the overlays?", answer: "All overlays come as PNG/WebM files compatible with OBS Studio, Streamlabs, and XSplit. Each pack includes a README with setup instructions." },
  { question: "Can I use these commercially?", answer: "Yes. All purchases include a commercial streaming license. You can use them on Twitch, YouTube, TikTok, and all major streaming platforms." },
  { question: "How do I download after purchase?", answer: "After purchase, go to My Orders in the menu. You'll find a Download button for each product in your order history." },
  { question: "Do you offer refunds?", answer: "Due to the digital nature of our products, all sales are final. If you encounter technical issues, contact us and we'll help resolve them." },
  { question: "What streaming software is supported?", answer: "OBS Studio, Streamlabs OBS, XSplit, and StreamElements. Most products also work with any software that supports browser sources." },
];

const AI_RESPONSES = [
  "The darkness welcomes you. What dark knowledge do you seek?",
  "Our products are crafted for those who dare to stream in the shadows. Browse our catalog to find your perfect horror setup.",
  "Check out our bundles if you want the complete experience — they include overlays, alerts, and everything you need to terrify your viewers.",
  "Need help? Head to My Orders to access all your purchased downloads anytime.",
  "Our overlays are OBS-ready. Just drag, drop, and let the horror begin.",
];

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: "Welcome to CreepyZone. I am your guide through the darkness. Ask me anything about our products.", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const lowerInput = input.toLowerCase();
    let response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];

    for (const faq of FAQS) {
      if (lowerInput.includes("format") || lowerInput.includes("obs") || lowerInput.includes("software")) {
        response = FAQS[0].answer;
        break;
      }
      if (lowerInput.includes("commercial") || lowerInput.includes("license")) {
        response = FAQS[1].answer;
        break;
      }
      if (lowerInput.includes("download") || lowerInput.includes("order")) {
        response = FAQS[2].answer;
        break;
      }
      if (lowerInput.includes("refund") || lowerInput.includes("return")) {
        response = FAQS[3].answer;
        break;
      }
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now(), text: response, isUser: false }]);
    }, 1000 + Math.random() * 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-80 border border-red-900/40 bg-black/95 backdrop-blur-md overflow-hidden"
            style={{ boxShadow: "0 0 30px rgba(180,0,0,0.3)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-red-900/30 bg-red-950/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-creepster text-white text-lg">Dark Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 text-sm ${
                    msg.isUser
                      ? "bg-red-800/50 text-white border border-red-700/30"
                      : "bg-card border border-red-900/30 text-gray-300"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-card border border-red-900/30 px-3 py-2 text-sm text-gray-500 flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {["Download help", "Formats?", "Refunds?"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="flex-shrink-0 text-xs px-3 py-1 border border-red-900/40 text-red-500 hover:bg-red-950/30 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex p-4 gap-2 border-t border-red-900/20">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask the darkness..."
                className="flex-1 px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white text-sm"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-red-700 hover:bg-red-600 text-white border border-red-500 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-red-700 hover:bg-red-600 border border-red-500 text-white flex items-center justify-center relative"
        style={{ boxShadow: "0 0 20px rgba(180,0,0,0.5)" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? {} : { boxShadow: ["0 0 20px rgba(180,0,0,0.5)", "0 0 30px rgba(180,0,0,0.8)", "0 0 20px rgba(180,0,0,0.5)"] }}
        transition={isOpen ? {} : { repeat: Infinity, duration: 2 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
