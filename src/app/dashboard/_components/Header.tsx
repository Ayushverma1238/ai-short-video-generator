"use client"
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter();
  return (
    <div className="flex z-10 sticky top-0 border-b border-gray-400 items-center justify-between px-6 py-5 bg-gray-800 text-white">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.svg"
          className=""
          alt="Photos"
          width={30}
          height={30}
        />
        <h2 className="text-lg font-bold ml-3">Ai Short Video</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={()=> router.push("/dashboard")} className={"bg-purple-500 hover:bg-purple-600 text-black border border-gray-100"}>Dashboard</Button>
        <UserButton />
      </div>
    </div>
  );
};

export default Header;
