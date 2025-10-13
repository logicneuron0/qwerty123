"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Leaderboard from "@/components/Leaderboard";

const Round2Page = () => {
  const router = useRouter();
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedAnswer = answer.trim().toLowerCase();

    if (trimmedAnswer === "answer1") {
      router.push("/game/techTask1");
    } else if (trimmedAnswer === "answer2") {
      router.push("/game/techTask2");
    } else {
      alert("Wrong answer!");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center text-center
      bg-[url('/images/background3.jpg')] bg-cover bg-center bg-fixed
      text-gray-200 p-4"
      style={{ fontFamily: "Simbiot, monospace" }}
    >
      {/* Title */}
      <h1
        className="text-5xl md:text-6xl font-bold mb-10"
        style={{
          fontFamily: "Death Markers Drip, cursive",
          letterSpacing: "6px",
          background: "linear-gradient(180deg, #C10000, #8A0303)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow:
            "0 0 15px rgba(193, 0, 0, 0.6), 0 0 30px rgba(138, 3, 3, 0.3)",
        }}
      >
        Key to Tech Round
      </h1>

      {/* Input & Submit Section */}
      <form
        onSubmit={handleSubmit}
        className="bg-black/70 border-2 border-[#5a0000] rounded-xl shadow-2xl
        p-6 md:p-8 w-full max-w-md backdrop-blur-sm"
      >
        <label
          htmlFor="answer"
          className="block text-lg md:text-xl mb-4 text-[#ff4d4d]"
        >
          Enter your key:
        </label>

        <input
          id="answer"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full p-3 mb-6 text-lg rounded-md border border-[#5a0000]
          bg-black/80 text-gray-200 focus:outline-none focus:border-[#ff0000]
          shadow-inner"
        />

        <button
          type="submit"
          className="w-full bg-[#880000] hover:bg-[#ff0000] text-white font-semibold
          text-lg py-2.5 rounded-md border-2 border-[#ff0000] transition-all
          duration-300 transform hover:scale-105 font-[Death Markers Drip]"
        >
          Submit
        </button>
      </form>
      <Leaderboard/>
    </div>
  );
};

export default Round2Page;
