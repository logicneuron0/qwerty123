"use client";
import Task5c from "@/components/Task5c";

export default function Game3cPage() {
  const handleSubmit = async (answer) => {
    if (answer.toLowerCase() === "treasure") {
      await fetch("/api/game/updateScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreToAdd: 30, nextStage: 4 }),
      });
      alert("Congrats! Task complete.");
    } else {
      alert("Wrong answer!");
    }
  };

  return <Task5c onSubmit={handleSubmit} />;
}
