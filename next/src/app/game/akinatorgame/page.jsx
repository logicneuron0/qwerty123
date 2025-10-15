"use client"
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Akinator from "@/components/Akinator";

export default function AkinatorGamePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.loggedIn) {
          router.push("/login");
          return;
        }
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user session:", err);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("⏰ Time's up! Moving to the next game...");
      router.push("/game/game2");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleRoundWin = async (roundNumber) => {
    try {
      await fetch("/api/game/updateScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreToAdd: 5,
          nextStage: (user?.stage || 1) + 1,
        }),
      });

      setUser((prev) => ({
        ...prev,
        score: (prev?.score || 0) + 5,
        stage: (prev?.stage || 1) + 1,
      }));
    } catch (err) {
      console.error("Error updating user score:", err);
    }

    if (roundNumber >= 4) {
      setGameCompleted(true);
      setTimeout(() => {
        router.push("/game/game2");
      }, 2500);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-red-800 bg-black">
        Loading your session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col items-center justify-center">
      <div className="absolute z-10 top-6 right-6 text-lg font-mono bg-gray-800 px-4 py-2 rounded-lg shadow-md">
        Time Left: <span className="text-green-400 font-semibold">{formatTime(timeLeft)}</span>
      </div>
      
      {!gameCompleted ? (
        <Akinator onRoundWin={handleRoundWin} userId={user.id} />
      ) : (
        <div className="text-center space-y-4" style={{fontFamily: "'Simbiot', monospace"}}>
          <h1 className="text-4xl font-bold text-green-400">
            You completed all 4 rounds!
          </h1>
          <p className="text-xl text-gray-400">
            Moving to the next challenge...
          </p>
        </div>
      )}
    </div>
  );
}