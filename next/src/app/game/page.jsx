import { getSession } from "@/lib/utils/auth-server";
import { redirect } from "next/navigation";
import BhangarhLauncher from "@/components/BhangarhLauncher";

export default async function GamePage() {
  const session = await getSession();
  if (!session) redirect("/"); // not logged in

  return (
    <div>      
      {/* New Bhangarh launcher */}
      <BhangarhLauncher />
    </div>
  );
}