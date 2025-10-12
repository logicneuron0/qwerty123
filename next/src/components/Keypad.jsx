"use client"
import React, { useState, useEffect, useRef } from 'react';
import styles from './Keypad.module.css';

const KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Keypad({onSubmit}) {
  const [keypad, setKeypad] = useState(KEYS);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState(''); // State for custom message/alert
  const [animateCharIdx, setAnimateCharIdx] = useState(null);
  const keyRefs = useRef({});
  const positions = useRef({});
  const hasMounted = useRef(false); // Ref to track initial mount

  const capturePositions = () => {
    positions.current = {};
    keypad.forEach(key => {
      const dom = keyRefs.current[key];
      if (dom) positions.current[key] = dom.getBoundingClientRect();
    });
  };

  const playFLIP = (newKeypad) => {
    if (!hasMounted.current) return;

    newKeypad.forEach(key => {
      const dom = keyRefs.current[key];
      if (dom && positions.current[key]) {
        const newRect = dom.getBoundingClientRect();
        const oldRect = positions.current[key];
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (dx || dy) {
          dom.style.transition = 'none';
          dom.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            dom.style.transition = 'transform 0.9s cubic-bezier(.22,1,.36,1)';
            dom.style.transform = '';
          });
        }
      }
    });
  };

  useEffect(() => {
     if (!hasMounted.current) {
        setKeypad(shuffle(KEYS));
        hasMounted.current = true;
    }
    const interval = setInterval(() => {
      capturePositions();
      setTimeout(() => {
        setKeypad(shuffle(KEYS));
      }, 200);
    }, 3000);

    const messageTimeout = setTimeout(() => setMessage(''), 3000);

    return () => {clearInterval(interval); clearTimeout(messageTimeout);}
  }, [message]);

  useEffect(() => {
    if (hasMounted.current){
      playFLIP(keypad);
    }
  }, [keypad]);

  const handleKeyPress = key => {
    setTyped(prev => prev + key);
    setAnimateCharIdx(typed.length);
  };

  const handleClear = () => {setTyped('');}
  
  const handleSubmit = () => {
   if (typed.trim()) {
      if(onSubmit){
        onSubmit(typed);
      }
      // setMessage(`Submitted: ${typed}`);
      setTyped(''); 
    } else {
      setMessage('Please enter a key sequence.');
    }
};


  useEffect(() => {
    if (animateCharIdx !== null) {
      const timeout = setTimeout(() => setAnimateCharIdx(null), 250);
      return () => clearTimeout(timeout);
    }
  }, [animateCharIdx]);

  return (
    <div className={styles.appContainer} style={{ backgroundImage: `url("/images/bg.jpg")` }}>
      <h2 className={`${styles.mainTitle} mb-15`}>Shuffling Keypad</h2>

      <div className={styles.transparentBox}>
        {message && (
          <div className="p-2 mb-4 text-sm font-medium text-center text-black bg-white/50 rounded-md">
            {message}
          </div>
        )}
        <div className={styles.typedBox}>
          {typed.split('').map((char, idx) => (
            <span
              key={idx}
              className={animateCharIdx === idx ? 'char-burst' : ''}
            >
              {char}
            </span>
          ))}
        </div>

        <div className={styles.buttonRow}>
          <button className={styles.clearBtn} onClick={handleClear}>
            Clear
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Submit
          </button>
        </div>

        <div className={`${styles.fixedGrid} keypadGrid`}>
          {keypad.map(key => (
            <button
              key={key}
              ref={el => (keyRefs.current[key] = el)}
              className={`${styles.keypadBtn} shadowCreep`}
              onClick={() => handleKeyPress(key)}
              aria-label={`Key ${key}`}
            >
              {key}
            </button>
          ))}
        </div>

        <p className={styles.footerText}>Keypad shuffles every 3 seconds.</p>
      </div>
    </div>
  );
}
