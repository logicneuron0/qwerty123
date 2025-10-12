"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Task2.module.css'

const Task2 = () => {

  const router = useRouter();
  const [answer, setAnswer] = useState("");

  const [demoInstructions, setDemoInstructions] = useState([
   "Pay attention to the screen. You'll see 10 riddles, one at a time.",
   "Each riddle will be displayed for 30 seconds.",
   "After the riddle disappears, you have 10 seconds to type your one-word answer in the space provided.",
   "After the last riddle, you'll need to remember the first letter of each of your 10 answers.",
   "Use these letters to form two words: one with 6 letters and one with 4 letters.",
   "You will have 1 minute to guess both words. If you need help, a hint will be provided for each word after 1 minute is over.",
   "All the best!"
  ]);

  // const [newDemoInstruction, setNewDemoInstruction] = useState('');

  const handleSubmit = async(e) => {
    e.preventDefault();
    const correctRiddleAnswer = process.env.NEXT_PUBLIC_RIDDLE || ""; 

    if (answer.trim().toLowerCase() == correctRiddleAnswer.trim().toLowerCase()) {
      // Update score + next stage in backend
      await fetch("/api/game/updateScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreToAdd: 20, nextStage: 2 }),
      });

      // Navigate to Game2 page
      router.push("/game/akinatorgame");
    } else{
      alert("wrong ans!")
    }
  };

  const handleClear = () => {
    setAnswer('');
  };

  return (
    <>
    <style jsx>{`
        @keyframes fadeInItem {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className={styles.appContainer}>
        <h1 className={styles.mainTitle}>Instructions</h1>

        <div className={styles.demoInstructionsList}>
          <ul className={styles.instructionList}>
            {demoInstructions.map((instruction, index) => (
              <li 
                key={index} 
                className={styles.instructionItem}
                style={{ 
                  animation: `fadeInItem 0.5s ease-out ${index * 0.1 + 0.9}s forwards` 
                }}
              >
                {instruction}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className={styles.demoInstructionForm}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer"
            rows="1"
          />
          <div className={styles.formButtons}>
            <button type="submit">Submit</button>
            <button type="button" onClick={handleClear}>Clear</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Task2;
