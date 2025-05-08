import React, { useState, useEffect } from "react";
import {
  RefreshCcw,
  Clipboard,
  Check,
  Code,
  AlignLeft,
  Sparkles,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [lispCode, setLispCode] = useState("");
  const [cCode, setCCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleConvert = async () => {
    if (!lispCode.trim()) {
      setError("Please enter some Lisp code first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: lispCode }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || data.message);
      setCCode(data.output);
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 1500);
    } catch (err) {
      setError(err.message);
      setCCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = () => setLispCode("(+ (* 2 3) (/ 10 5))");

  const SuccessParticles = () => (
    <AnimatePresence>
      {showSuccessAnimation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                isDarkMode ? "bg-indigo-400" : "bg-indigo-600"
              }`}
              initial={{ opacity: 1, x: "50%", y: "50%", scale: 0 }}
              animate={{
                opacity: 0,
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                scale: Math.random() * 2 + 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-black text-gray-100"
          : "bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-100 text-gray-800"
      }`}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`p-4 shadow-lg border-b backdrop-blur-sm flex justify-between items-center ${
          isDarkMode
            ? "bg-gray-900/80 border-gray-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          >
            <Code
              className={`h-6 w-6 ${
                isDarkMode ? "text-indigo-400" : "text-indigo-600"
              }`}
            />
          </motion.div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Lisp to C Converter
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
              : "bg-blue-100 hover:bg-blue-200 text-indigo-600"
          }`}
        >
          {isDarkMode ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </motion.button>
      </motion.header>

      {/* Main */}
      <main className="container mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 relative">
        <SuccessParticles />

        {/* Left */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full md:w-1/2 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlignLeft className="h-5 w-5" />
              Lisp Code
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadExample}
              className={`text-xs py-1 px-3 rounded-full font-medium transition 
                ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                }`}
            >
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Load Example
              </span>
            </motion.button>
          </div>
          <div
            className={`relative rounded-lg overflow-hidden ${
              isDarkMode
                ? "shadow-lg shadow-purple-900/20"
                : "shadow-md shadow-indigo-200"
            }`}
          >
            <textarea
              placeholder="Enter Lisp code here..."
              value={lispCode}
              onChange={(e) => setLispCode(e.target.value)}
              className={`p-4 rounded-lg font-mono text-sm resize-none min-h-64 w-full focus:outline-none focus:ring-2 transition-all duration-300
                ${
                  isDarkMode
                    ? "bg-gray-800/90 border border-gray-700 text-white focus:ring-indigo-500"
                    : "bg-white/90 border border-gray-300 text-gray-800 focus:ring-indigo-400"
                }`}
            />
            {/* Code editor line numbers effect */}
            <div className="absolute top-4 left-2 opacity-30 pointer-events-none font-mono text-xs">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-6">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConvert}
            disabled={isLoading || !lispCode.trim()}
            className={`py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition 
              ${
                isLoading || !lispCode.trim()
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : isDarkMode
                  ? "bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-lg shadow-purple-900/30"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-300/50"
              }`}
          >
            {isLoading ? (
              <>
                <RefreshCcw className="h-5 w-5 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Convert to C
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full md:w-1/2 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Code className="h-5 w-5" />
              Generated C Code
            </h2>
            {cCode && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className={`flex items-center gap-1 py-1 px-3 rounded text-sm transition 
                  ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                  }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4" />
                    Copy
                  </>
                )}
              </motion.button>
            )}
          </div>
          <div
            className={`p-4 rounded-lg font-mono text-sm min-h-64 overflow-auto border relative ${
              isDarkMode
                ? "bg-gray-800/90 border-gray-700 text-white shadow-lg shadow-purple-900/20"
                : "bg-white/90 border-gray-300 text-gray-800 shadow-md shadow-indigo-200"
            }`}
          >
            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500"
                >
                  {error}
                </motion.p>
              ) : cCode ? (
                <motion.pre
                  key="code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-pre-wrap"
                >
                  {cCode}
                </motion.pre>
              ) : (
                <motion.p
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`italic ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  C code will appear here after conversion...
                </motion.p>
              )}
            </AnimatePresence>

            {/* Code syntax highlighting effect */}
            {cCode && !error && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div
                  className={`h-6 w-16 rounded ${
                    isDarkMode ? "bg-blue-500/10" : "bg-blue-500/5"
                  } absolute top-4 left-4`}
                ></div>
                <div
                  className={`h-6 w-24 rounded ${
                    isDarkMode ? "bg-purple-500/10" : "bg-purple-500/5"
                  } absolute top-12 left-8`}
                ></div>
                <div
                  className={`h-6 w-20 rounded ${
                    isDarkMode ? "bg-green-500/10" : "bg-green-500/5"
                  } absolute top-20 left-4`}
                ></div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className={`p-4 text-center text-sm border-t backdrop-blur-sm ${
          isDarkMode
            ? "text-gray-400 bg-gray-900/80 border-gray-700"
            : "text-gray-600 bg-white/80 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span>© {new Date().getFullYear()} Lisp to C Converter</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></span>
          <span>Built with React</span>
        </div>
      </motion.footer>
    </div>
  );
}
