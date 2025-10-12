"use client";
import Task5a from "@/components/Task5a";

export default function Game3aPage() {
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

  return <Task5a onSubmit={handleSubmit} />;
}
