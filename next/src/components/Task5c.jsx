"use client"
import React, { useState } from 'react';
import styles from './Task5.module.css'


const Task5c = ({onSubmit}) => {
  
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
  


  const handleSubmit = async(e) => {
    e.preventDefault();
    const answer = newDemoInstruction.trim();
    if (answer) {
      if (answer.trim().toLowerCase() === '27') {
       await onSubmit(answer);

      } 
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

      {/* {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={`${styles.popupContent} ${isCorrect ? styles.correct : styles.wrong}`}>
            <p>{popupMessage}</p>
            <button onClick={closePopup} className={styles.popupCloseBtn}>Close</button>
          </div>
        </div>
      )} */}

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

        {/* <div className={styles.questionsContainer}>
          {questions.map(q => (
            <QuestionCard 
              key={q.id} 
              imageUrl={q.imageUrl} 
              questionNumber={q.id} 
            />
          ))}
        </div> */}

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

export default Task5c;