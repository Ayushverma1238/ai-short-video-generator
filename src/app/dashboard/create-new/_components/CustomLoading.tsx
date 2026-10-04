import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

const CustomLoading = ({ loading }: { loading: boolean }) => {
  return (
    <div>
      <AlertDialog open={loading}>
        {/* <AlertDialogTrigger render={<Button variant="outline" />}>
          Show Dialog
        </AlertDialogTrigger> */}
        <AlertDialogContent className={`bg-black/95 text-white`}>
          <div className="flex items-center justify-center py-10 flex-col gap-6"> 
            <Image src={"/progress.gif"} width={100} height={100} alt="loading" className="bg-black rounded-2xl" />
            <h2>Generating yur video... Do not Refresh</h2>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomLoading;
