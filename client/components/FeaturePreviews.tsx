import React, { useState, useEffect } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Check, X, MessageCircle, User, Bot, ArrowRight } from 'lucide-react';

// Mock Flashcard Preview
export const FlashcardPreview: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  
  const cards = [
    { front: "Що таке React?", back: "JavaScript бібліотека для створення UI" },
    { front: "Що таке TypeScript?", back: "Типізована надмножина JavaScript" },
    { front: "Що таке Tailwind CSS?", back: "Utility-first CSS фреймворк" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, [currentCard]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl h-[400px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Флеш-картки</span>
        <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
          {currentCard + 1} / {cards.length}
        </span>
      </div>
      
      {/* Card */}
      <div className="p-6 h-[calc(100%-110px)] flex items-center justify-center perspective-1000">
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center p-6 text-white shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <p className="text-sm uppercase tracking-wider opacity-70 mb-3">Питання</p>
              <p className="text-xl font-bold">{cards[currentCard].front}</p>
            </div>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center p-6 border-2 border-primary shadow-lg"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-center">
              <p className="text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Відповідь</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{cards[currentCard].back}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="px-4 py-3 flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => { setCurrentCard(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Перевернути
        </button>
        <button 
          onClick={() => { setCurrentCard(prev => Math.min(cards.length - 1, prev + 1)); setIsFlipped(false); }}
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Mock Quiz Preview
export const QuizPreview: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const question = {
    text: "Яка основна особливість TypeScript?",
    options: ["Динамічна типізація", "Статична типізація", "Без типізації", "Автоматична типізація"],
    correct: 1
  };

  useEffect(() => {
    const timer1 = setTimeout(() => setSelected(1), 2000);
    const timer2 = setTimeout(() => setShowResult(true), 3500);
    const timer3 = setTimeout(() => { setSelected(null); setShowResult(false); }, 6000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl h-[400px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Тестування</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-primary rounded-full"></div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">1/10</span>
        </div>
      </div>
      
      {/* Question */}
      <div className="p-6">
        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6">{question.text}</h4>
        
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => { setSelected(idx); setShowResult(true); }}
              className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${
                showResult && idx === question.correct
                  ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400'
                  : showResult && selected === idx && idx !== question.correct
                  ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-400'
                  : selected === idx
                  ? 'bg-primary/10 dark:bg-primary/20 border-2 border-primary text-primary'
                  : 'bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary/50'
              }`}
            >
              <span className="font-medium">{option}</span>
              {showResult && idx === question.correct && <Check className="w-5 h-5 text-green-500" />}
              {showResult && selected === idx && idx !== question.correct && <X className="w-5 h-5 text-red-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mock Mind Map Preview
export const MindMapPreview: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl h-[400px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 z-10">
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Ментальна карта</span>
        <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
          12 вузлів
        </span>
      </div>
      
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      {/* Mind Map SVG */}
      <svg className="w-full h-full" viewBox="0 0 400 350">
        {/* Lines */}
        <line x1="200" y1="175" x2="100" y2="100" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="2"/>
        <line x1="200" y1="175" x2="300" y2="100" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="2"/>
        <line x1="200" y1="175" x2="100" y2="250" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="2"/>
        <line x1="200" y1="175" x2="300" y2="250" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="2"/>
        
        <line x1="100" y1="100" x2="50" y2="60" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="1.5"/>
        <line x1="100" y1="100" x2="50" y2="120" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="1.5"/>
        <line x1="300" y1="100" x2="350" y2="60" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="1.5"/>
        <line x1="300" y1="100" x2="350" y2="120" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="1.5"/>
        
        {/* Central node */}
        <g transform="translate(200, 175)">
          <rect x="-50" y="-20" width="100" height="40" rx="20" className="fill-slate-900 dark:fill-primary"/>
          <text x="0" y="5" textAnchor="middle" className="fill-white text-xs font-bold">Основна тема</text>
        </g>
        
        {/* Branch nodes */}
        <g transform="translate(100, 100)">
          <rect x="-35" y="-15" width="70" height="30" rx="15" className="fill-white dark:fill-slate-700 stroke-slate-200 dark:stroke-slate-600" strokeWidth="2"/>
          <text x="0" y="5" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-xs font-medium">Розділ 1</text>
        </g>
        
        <g transform="translate(300, 100)">
          <rect x="-35" y="-15" width="70" height="30" rx="15" className="fill-white dark:fill-slate-700 stroke-slate-200 dark:stroke-slate-600" strokeWidth="2"/>
          <text x="0" y="5" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-xs font-medium">Розділ 2</text>
        </g>
        
        <g transform="translate(100, 250)">
          <rect x="-35" y="-15" width="70" height="30" rx="15" className="fill-white dark:fill-slate-700 stroke-slate-200 dark:stroke-slate-600" strokeWidth="2"/>
          <text x="0" y="5" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-xs font-medium">Розділ 3</text>
        </g>
        
        <g transform="translate(300, 250)">
          <rect x="-35" y="-15" width="70" height="30" rx="15" className="fill-white dark:fill-slate-700 stroke-slate-200 dark:stroke-slate-600" strokeWidth="2"/>
          <text x="0" y="5" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-xs font-medium">Розділ 4</text>
        </g>
        
        {/* Leaf nodes */}
        <g transform="translate(50, 60)">
          <circle r="8" className="fill-primary/20 stroke-primary" strokeWidth="2"/>
        </g>
        <g transform="translate(50, 120)">
          <circle r="8" className="fill-primary/20 stroke-primary" strokeWidth="2"/>
        </g>
        <g transform="translate(350, 60)">
          <circle r="8" className="fill-accent/20 stroke-accent" strokeWidth="2"/>
        </g>
        <g transform="translate(350, 120)">
          <circle r="8" className="fill-accent/20 stroke-accent" strokeWidth="2"/>
        </g>
      </svg>
    </div>
  );
};

// Mock Chat Preview
export const ChatPreview: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Привіт! Я твій AI-асистент. Чим можу допомогти?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setMessages(prev => [...prev, { role: 'user', text: 'Поясни мені що таке React hooks?' }]);
    }, 2000);
    
    const timer2 = setTimeout(() => setIsTyping(true), 3000);
    
    const timer3 = setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: 'React Hooks - це функції, які дозволяють використовувати стан та інші можливості React без написання класів.' 
      }]);
    }, 5000);
    
    const timer4 = setTimeout(() => {
      setMessages([{ role: 'bot', text: 'Привіт! Я твій AI-асистент. Чим можу допомогти?' }]);
    }, 8000);
    
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl h-[400px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-800 dark:text-white block">AI Асистент</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Online</span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-slate-200 dark:bg-slate-600' 
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-slate-900 dark:bg-primary text-white rounded-tr-sm'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-600'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5">
          <MessageCircle className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-400">Запитай щось...</span>
          <button className="ml-auto p-1.5 bg-primary text-white rounded-lg">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
