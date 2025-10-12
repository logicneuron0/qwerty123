"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Akinator from "@/components/Akinator";

export default function AkinatorGamePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);

  // ✅ Fetch logged-in user info
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

  // ✅ Update user score & stage when round is completed
  const handleRoundWin = async (roundNumber) => {
    try {
      await fetch("/api/game/updateScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreToAdd: 20,
          nextStage: (user?.stage || 1) + 1,
        }),
      });

      setUser((prev) => ({
        ...prev,
        score: (prev?.score || 0) + 20,
        stage: (prev?.stage || 1) + 1,
      }));
    } catch (err) {
      console.error("Error updating user score:", err);
    }

    // ✅ If this was the 4th (final) round, end game
    if (roundNumber >= 4) {
      setGameCompleted(true);
      setTimeout(() => {
        router.push("/game/game2");
      }, 2500); // redirect after a short pause
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-400">
        Loading your session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col items-center justify-center">
      {!gameCompleted ? (
        <Akinator onRoundWin={handleRoundWin} />
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-green-400">
            🎉 You completed all 4 rounds!
          </h1>
          <p className="text-xl text-gray-400">
            Moving to the next challenge...
          </p>
        </div>
      )}
    </div>
  );
}
