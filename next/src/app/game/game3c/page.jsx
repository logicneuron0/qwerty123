"use client";
import Task5c from "@/components/Task5c";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Game3cPage() {

  const router = useRouter();
  const [startTime, setStartTime] = useState(null);
  
  useEffect(() => { 
    setStartTime(Date.now()); // Record start time when game loads
  }, []);

  const handleSubmit = async (answer) => {
    if (answer.toLowerCase() === "27") {

      const endTime = Date.now();
      const timeTakenMinutes = (endTime - startTime) / 60000; // convert ms → minutes

      let score = 5;
      if (timeTakenMinutes <= 5) score = 20;
      else if (timeTakenMinutes <= 10) score = 10;
      
      await fetch("/api/game/updateScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreToAdd: score, nextStage: 4 }),
        credentials: "include"

      });
      alert("Congrats! Task complete.");
      router.push("/game/round2")
    } else {
      alert("Wrong answer!");
    }
  };  

  return <Task5c onSubmit={handleSubmit} />;
}
