"use client"
import React, { useState } from 'react';
import styles from './Task5.module.css'
import Image from 'next/image';

const QuestionCard = ({ imageUrl, questionNumber }) => {
  return (
    <div className={styles.questionCard}>
      <h3 className={styles.cardTitle}>Question {questionNumber}</h3>
      <div className={styles.cardImageContainer}>
        <Image 
          src={imageUrl} 
          alt={`Question ${questionNumber}`} 
          className={styles.cardImage}
          width={600}
          height={200}
          style={{ objectFit: 'cover' }}
        />
      </div>
    </div>
  );
};

const Task5d = () => {
  const [demoInstructions, setDemoInstructions] = useState([
    "Solve each clue to find a number in the grid.", 
    "Each number eliminates its row and/A/or column as specified.", 
    "After all 10 clues, only one cell will remain! Enter the number to advance",
    "All the best!"
  ]);

  const [newDemoInstruction, setNewDemoInstruction] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  
  const questions = [
    { id: 1, imageUrl: '/images/D/q1.png' }, 
    { id: 2, imageUrl: '/images/D/q2.png' },
    { id: 3, imageUrl: '/images/D/q3.png' },
    { id: 4, imageUrl: '/images/D/q4.png' },
    { id: 5, imageUrl: '/images/D/q5.png' }, 
    { id: 6, imageUrl: '/images/D/q6.png' },
    { id: 7, imageUrl: '/images/D/q7.png' },
    { id: 8, imageUrl: '/images/D/q8.png' },
    { id: 9, imageUrl: '/images/D/q9.png' }, 
    { id: 10, imageUrl: '/images/D/q10.png' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const answer = newDemoInstruction.trim();
    if (answer) {
      if (answer === '27') {
        setPopupMessage('Correct Answer!');
        setIsCorrect(true);
      } else {
        setPopupMessage('Wrong Answer!');
        setIsCorrect(false);
      }
      setShowPopup(true);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setNewDemoInstruction('');
  };

  const handleClear = () => {
    setNewDemoInstruction('');
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

      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={`${styles.popupContent} ${isCorrect ? styles.correct : styles.wrong}`}>
            <p>{popupMessage}</p>
            <button onClick={closePopup} className={styles.popupCloseBtn}>Close</button>
          </div>
        </div>
      )}

      <div className={styles.appContainer}>
        <h1 className={styles.mainTitle}>Math Challenge</h1>

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

        <div className={styles.questionsContainer}>
          {questions.map(q => (
            <QuestionCard 
              key={q.id} 
              imageUrl={q.imageUrl} 
              questionNumber={q.id} 
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.demoInstructionForm}>
          <textarea
            value={newDemoInstruction}
            onChange={(e) => setNewDemoInstruction(e.target.value)}
            placeholder="Enter your answer..."
            rows="2"
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

export default Task5d;