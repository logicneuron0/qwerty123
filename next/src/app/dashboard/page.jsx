'use client'
import Keypad from "@/components/Keypad";
import Login from "@/components/Login";

export default function DashboardPage() {
  return (
    <div className="h-[100vh] flex flex-col items-center justify-center align-middle">
      {/* <Keypad/> */}
      <Login/>
    </div>
  );
}
