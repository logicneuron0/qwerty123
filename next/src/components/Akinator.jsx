"use client";
import styles from './Akinator.module.css';

import { useState, useRef, useEffect } from 'react';
import { Skull, RefreshCw, ChevronRight } from 'lucide-react'; 

export default function Akinator({onRoundWin}) {
const [API_BASE_URL, setApiBaseUrl] = useState('http://127.0.0.1:5000'); 

const [messages, setMessages] = useState([]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [pastAnswers, setPastAnswers] = useState([]);
const [gameOver, setGameOver] = useState(false); // True when current round is won (BINGO!)
const [isGameCompleted, setIsGameCompleted] = useState(false); // True when ALL rounds are finished
const [roundStatus, setRoundStatus] = useState({ currentRound: 0, totalRounds: 0 });
const [crystalActive, setCrystalActive] = useState(false);

const messagesEndRef = useRef(null);
const inputRef = useRef(null);

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

useEffect(() => {
  scrollToBottom();
}, [messages]);

useEffect(() => {
  setApiBaseUrl('http://localhost:5000'); 
  
  const fogOverlay = document.createElement('div');
  fogOverlay.className = 'fog-overlay';
  document.body.appendChild(fogOverlay);
  
  if (!gameOver && inputRef.current) {
      inputRef.current.focus();
  }

  return () => {
    document.body.removeChild(fogOverlay);
  };
}, [gameOver]); 


const fetchGameStatus = async () => {
  setIsLoading(true);
  try {
      const response = await fetch(`${API_BASE_URL}/api/status`);
      const data = await response.json();

      if (data.game_ready && data.total_rounds > 0) {
          const currentRound = data.total_rounds - data.remaining_rounds + 1;
          setRoundStatus({ currentRound, totalRounds: data.total_rounds });
          setMessages([{
              id: 1,
              text: `Welcome! Starting Round ${currentRound} of ${data.total_rounds}. Ask me yes/no questions to discover the character.`,
              sender: 'bot'
          }]);
          setGameOver(false);
          setIsGameCompleted(false);
          setPastAnswers([]);
      } else if (data.total_rounds === 0) {
          setMessages([{ id: 1, text: "ERROR: Database is empty. Please check your MongoDB connection or run the data population script.", sender: 'bot' }]);
      } else {
          setMessages([{ id: 1, text: "The spirits are silent... Could not connect to the realm of the Game Master.", sender: 'bot' }]);
      }
  } catch (error) {
      console.error("Failed to fetch initial status:", error);
      setMessages([{ id: 1, text: `ERROR: Could not connect to Flask backend at ${API_BASE_URL}. Ensure your 'app.py' server is running.`, sender: 'bot' }]);
  } finally {
      setIsLoading(false);
  }
};

useEffect(() => {
  fetchGameStatus();
}, [API_BASE_URL]); 

const startNextRound = async () => {
  if (isGameCompleted) return;
  setIsLoading(true);

  try {
      const response = await fetch(`${API_BASE_URL}/api/next_character`);
      const data = await response.json();

      if (data.status === "GAME_OVER_ALL_ROUNDS") {
          setIsGameCompleted(true);
          setGameOver(true);
          setRoundStatus(prev => ({ ...prev, currentRound: prev.totalRounds + 1 }));
          
          setMessages(prev => [...prev, {
              id: prev.length + 1,
              text: `🎉 The spirits are quiet. You have successfully guessed all ${roundStatus.totalRounds} characters! Game Over.`,
              sender: 'bot',
          }]);
          
      } else if (data.status === "NEXT_ROUND_STARTED") {
          const nextRoundNumber = roundStatus.currentRound + 1;
          setRoundStatus(prev => ({ ...prev, currentRound: nextRoundNumber }));
          setGameOver(false);
          setPastAnswers([]);
          
          setMessages([{
              id: 1, 
              text: `New Round! Guess Character ${nextRoundNumber} of ${data.total_rounds}. Ask me yes/no questions to discover who it is.`,
              sender: 'bot'
          }]);
      }
  } catch (error) {
      console.error('Next Round Error:', error);
      setMessages(prev => [...prev, { id: prev.length + 1, text: "ERROR: Failed to summon the next character.", sender: 'bot' }]);
  } finally {
      setIsLoading(false);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim() || isLoading || gameOver) return;

  const currentQuestion = input;
  const userMessage = { id: messages.length + 1, text: currentQuestion, sender: 'user' };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);
  setCrystalActive(true);
  
  

  try {
    const response = await fetch(`${API_BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        question: currentQuestion, 
        pastAnswers: pastAnswers.filter(a => a.answer !== 'BINGO!').map(a => ({ question: a.question, answer: a.answer }))
      })
    });

    const data = await response.json();
    
    setPastAnswers(prev => [...prev, {
      question: currentQuestion,
      answer: data.answer
    }]);
    
    const botMessage = { 
      id: messages.length + 2, 
      text: data.answer, 
      sender: 'bot',
      isAnswer: true 
    };
    setMessages(prev => [...prev, botMessage]);
    
    if (data.hint && !data.gameOver) {
      setTimeout(() => {
        const hintMessage = { 
          id: messages.length + 3, 
          text: data.hint, 
          sender: 'bot',
          isHint: true 
        };
        setMessages(prev => [...prev, hintMessage]);
      }, 1000);
    }
    
    // Check if game is over
    if (data.gameOver) {
      setGameOver(true);
      const congratsMessage = { 
        id: messages.length + 4, 
        text: `🎉 BINGO! You correctly guessed the character! Ready for the next challenge?`, 
        sender: 'bot'
      };
      setTimeout(() => {
        setMessages(prev => [...prev, congratsMessage]);
      }, 1500);

      if(typeof onRoundWin==="function"){
        onRoundWin(roundStatus.currentRound)
      }
     
    }
    
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = { 
      id: messages.length + 2, 
      text: `The spirits are disturbed... (Connection Error: Could not reach ${API_BASE_URL})`, 
      sender: 'bot'
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
    setCrystalActive(false);
  }
};
  
  
return (
  <div className={styles.hauntedBg} style={{ fontFamily: "'Simbiot', monospace" }}>
    <div className="container mx-auto px-4 py-8 relative z-10">
      <header className="text-center mb-8">
              <h1 className="font-bold text-6xl md:text-7xl mb-10 text-center bg-gradient-to-b from-[#C10000] to-[#8A0303] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(193,0,0,0.6)]" style={{ fontFamily: "'Death Markers Drip', cursive", letterSpacing: '6px' }}>Reverse Akinator</h1>
        {roundStatus.totalRounds > 0 && !isGameCompleted && (
          <p className="text-xl font-bold font-crimson">
              {`Round ${roundStatus.currentRound} of ${roundStatus.totalRounds}`}
          </p>
        )}
        {isGameCompleted && (
           <p className="text-xl font-bold text-green-400 font-crimson">
              {`All ${roundStatus.totalRounds} Rounds Completed!`}
          </p>
        )}
      </header> 
      
      <main className="max-w-2xl mx-auto">
          {/* <div className="bg-gray-700/30 backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden border border-gray-500/50 flex flex-col h-[80vh] min-h-[500px]"> */}
          <div className="bg-gray-700/30  backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden border-gray-700 haunted-shadow flex flex-col h-[80vh] min-h-[500px]">
          <div id="crystal-ball" className={`relative w-32 h-32 mx-auto mt-6 mb-4 ${crystalActive ? 'crystal-active' : ''}`}>
                    <div className="absolute inset-0 rounded-full bg-opacity-30 shadow-2xl crystal-glow">
                       <img src="/images/rune1.png" alt="Mystical Rune" className="swirling-icon" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* <svg className="w-24 h-24 text-red-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                             <path d="M12 2C6.48 2 2 6.48 2 12V16C2 18.21 3.79 20 6 20H8V22H16V20H18C20.21 20 22 18.21 22 16V12C22 6.48 17.52 2 12 2ZM20 16C20 17.1 19.1 18 18 18H6C4.9 18 4 17.1 4 16V12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12V16ZM10 10H8V8H10V10ZM16 10H14V8H16V10ZM12 17C10.68 17 9.5 16.4 8.5 15.25L9.5 14.25C10.25 15.1 11.25 15.75 12 15.75C12.75 15.75 13.75 15.1 14.5 14.25L15.5 15.25C14.5 16.4 13.32 17 12 17Z"/>
                        </svg> */}
                     </div>
                 </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 message-container">
                  {messages.map((message) => (
                      <div 
                          key={message.id} 
                          className={`flex w-full mb-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                          {message.sender === 'bot' && (
                              <div className="flex items-end mr-3 text-red-400">
                                  <Skull className="warning-skull" />
                              </div>
                          )}

                          <div
                              className={`max-w-[75%] px-4 py-2 text-gray-100 shadow-lg animation-fadeIn text-left 
                                  ${message.sender === 'user'
                                  ? 'bg-purple-900/40 rounded-xl rounded-br-none border-r-2 border-purple-400'
                                  : message.isHint
                                  ? 'bg-red-900/40 rounded-xl rounded-tl-none border-l-2 border-fuchsia-400 text-sm italic' 
                                  : 'bg-gray-800/70 rounded-xl rounded-tl-none border-l-2 border-purple-600' 
                              }`}
                          >
                              {message.text === 'BINGO!' 
                                  ? <span className="font-extrabold text-xl text-yellow-400">BINGO!</span>
                                  : message.text === 'TRUE' 
                                  ? <span className="font-bold text-green-400">{message.text}</span>
                                  : message.text === 'FALSE' 
                                  ? <span className="font-bold text-red-400">{message.text}</span>
                                  : message.text
                              }
                          </div>
                          
                          {message.sender === 'user' && (
                              <div className="flex items-end ml-3 text-2xl text-gray-400">👤</div>
                          )}
                      </div>
                  ))}
                  {isLoading && (
                      <div className="flex justify-start mb-3">
                          <div className="flex items-end mr-3 text-red-400"><Skull className="warning-skull" /></div>
                          <div className="bg-gray-800/70 px-4 py-2 rounded-xl rounded-tl-none border-l-2 border-purple-600 text-gray-400">
                              Thinking...
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t border-gray-800 bg-gray-900 bg-opacity-90">
                  
                  {gameOver && !isGameCompleted && (
                      <button 
                          type="button" 
                          onClick={startNextRound}
                          disabled={isLoading}
                          className="w-full py-3 px-4 bg-fuchsia-800 hover:bg-fuchsia-700 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-fuchsia-600 transition-colors duration-200 flex items-center justify-center gap-2 font-bold disabled:bg-gray-500"
                      >
                          {isLoading 
                              ? 'Summoning Next Character...' 
                              : <><ChevronRight className="h-5 w-5" /> Start Round {roundStatus.currentRound + 1}</>
                          }
                      </button>
                  )}

                  {gameOver && isGameCompleted && (
                      <button 
                          type="button" 
                          onClick={fetchGameStatus} 
                          className="w-full py-3 px-4 bg-red-800 hover:bg-red-700 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors duration-200 flex items-center justify-center gap-2 font-bold"
                      >
                          <RefreshCw className="h-5 w-5" /> Play New Game
                      </button>
                  )}

                  {!gameOver && (
                      <form onSubmit={handleSubmit} className="flex space-x-2">
                          <input 
                              ref={inputRef} 
                              type="text" 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              className="flex-1 p-2 rounded bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                              placeholder="Ask a question about the mysterious entity... "
                              disabled={isLoading || gameOver}
                              autoComplete="off"
                          />
                          <button 
                              type="submit" 
                              className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-600 transition-colors duration-200 disabled:bg-gray-500"
                              disabled={isLoading || gameOver || !input.trim()}
                          >
                              Ask
                          </button>
                      </form>
                  )}
              </div>
          </div>
          
          <div className="mt-6 text-center text-gray-500 text-lg">
              <p>The spirits are watching... Choose your questions wisely.</p>
          </div>
      </main>
    </div>
  </div>
  );
}