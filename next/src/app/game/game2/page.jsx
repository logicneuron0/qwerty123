"use client";
import { useRouter } from "next/navigation";
import Keypad from "@/components/Keypad";

export default function Game2Page() {
  const router = useRouter();

  const handleSubmit = async (answer) => {

    if (answer.toLowerCase() === "2234") {
      await fetch("/api/game/updateScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreToAdd: 20, nextStage: 3 }),
        credentials: "include"
      });

      const res = await fetch("/api/auth/me", {
        credentials: "include"
      });
      const data = await res.json();
      console.log("Fetched data:", data);

      if (!data.user || !data.user.faction) {
        alert("Could not get faction. Please re-login.");
        return;
      }
      
      switch (data.user.faction) {
        case "heirs":
          router.push("/game/game3a");
          break;
        case "researchers":
          router.push("/game/game3b");
          break;
        case "treasurers":
          router.push("/game/game3c");
          break;
        case "investigators":
          router.push("/game/game3d");
          break;
        default:
          alert("Faction not found!");
      }
    } else {
      alert("Wrong answer!");
    }
  };

  return <Keypad onSubmit={handleSubmit} />;
}
