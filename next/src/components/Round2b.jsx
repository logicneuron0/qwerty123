"use client";
import React, { useState } from "react";

const Round2b = () => {
  const [answer, setAnswer] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [score, setScore] = useState(0);
  const [completionTime, setCompletionTime] = useState("");

  const correctAnswer = process.env.NEXT_PUBLIC_TECH2;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      const now= new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setCompletionTime(formattedTime)

      setScore((prev) => prev + 100);
      setShowModal(true);
      setAnswer("");
    } else {
      alert("Wrong Answer!");
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[url('/images/background3.jpg')] bg-cover bg-center bg-fixed text-gray-200 font-sans px-4 py-10" style={{ fontFamily: "'Simbiot', monospace" }}>
      {/* Title */}
      <h1 className="font-bold text-6xl md:text-7xl mb-10 text-center bg-gradient-to-b from-[#C10000] to-[#8A0303] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(193,0,0,0.6)]"
        style={{ fontFamily: "'Death Markers Drip', cursive", letterSpacing: '6px' }}>
        Tech Task
      </h1>

      {/* Instruction Box */}
      <div className="bg-black/70 border-2 border-[#5a0000] rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.7)] backdrop-blur-sm p-6 w-full max-w-2xl mb-8">
        <h2 className="text-2xl font-semibold text-[#ff4d4d] mb-4">Instructions</h2>
        <ul className="list-decimal list-inside space-y-3 text-lg">
          <li>Complete the given technical task carefully.</li>
          <li>Enter the final sentence.</li>
        </ul>
        <div className="mt-4">
          <a
            href="https://drive.google.com/drive/u/3/folders/1JqrwqtWT-sLSG6uzDCBQPqktpE2xX2ML" // replace with your actual Google Drive link
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
            className="text-[#ff0000] underline hover:text-[#ff4d4d] text-decoration-none no-underline"
          >
            🔗 Open Google Drive Task
          </a>
        </div>
      </div>

      {/* Input + Submit */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center bg-black/70 border-2 border-[#5a0000] rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.7)] backdrop-blur-sm p-6 w-full max-w-2xl"
      >
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          className="w-full p-3 mb-4 rounded-lg bg-black/80 text-gray-200 border border-[#5a0000] focus:outline-none focus:border-[#ff0000] focus:shadow-[0_0_10px_rgba(255,0,0,0.5)] placeholder-gray-500"
        />
        <button
          type="submit"
          className="bg-[#880000] border-2 border-[#ff0000] text-white px-6 py-2 rounded-lg text-xl font-semibold tracking-widest transition-all duration-300 hover:bg-[#ff0000] hover:scale-105 shadow-[0_8px_20px_rgba(255,0,0,0.5)]"
        >
          Submit
        </button>
      </form>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-[#1a1a1a] border-2 border-[#ff0000] rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-fadeInTech">
            <h3 className="text-3xl font-bold text-[#ff0000] mb-4">
              Game Over !!
            </h3>
            <p className="text-xl text-gray-200 mb-6">
              Get ready for <span className="text-[#ff4d4d] font-semibold">Treasure Hunt!!</span>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Completed at: <span className="text-[#ff4d4d]">{completionTime}</span>
            </p>
            <p className="text-lg text-green-400 mb-6">+100 Points Added! 🎯</p>

            <form method="POST" action="/api/auth/logout">
         <button
           type="submit"
           className="bg-[#880000] border-2 border-[#ff0000] text-white px-5 py-2 rounded-lg text-lg transition-all duration-300 hover:bg-[#ff0000] hover:scale-105"
         >
           Logout
         </button>
       </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Round2b;
