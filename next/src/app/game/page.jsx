import Task2 from "@/components/Task2";
import { getSession } from "@/lib/utils/auth-server";
import { redirect } from "next/navigation";
// import { useRouter } from "next/navigation";


export default async function GamePage() {

  // const router = useRouter();
  const session = await getSession();
  if (!session) redirect("/"); // not logged in

  // const handleGame1Submit = async (answer) => {
  //   if (answer.toLowerCase() === "correct1") {
  //     await fetch("/api/game/updateScore", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ scoreToAdd: 20, nextStage: 2 }),
  //     });
  //     router.push("/game/game2");
  //   } else {
  //     alert("Wrong answer!");
  //   }
  // };

  return <Task2/>

    // <div>
    //   <Task5a/>
    //         <Keypad/>
    //         <Task2/>
    //         <div className="min-h-screen flex flex-col items-center justify-center bg-green-100">
    //   <h1 className="text-3xl font-bold mb-4">
    //     Welcome, {session.username} 🎮
    //   </h1>
    //   <p>Your session is active! Let's play.</p>
    //   <form method="POST" action="/api/auth/logout">
    //     <button
    //       type="submit"
    //       className="mt-6 px-4 py-2 bg-red-500 text-white rounded"
    //     >
    //       Logout
    //     </button>
    //   </form>
    // </div>
    // </div>
   
  
}

