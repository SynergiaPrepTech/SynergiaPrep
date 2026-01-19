"use client";

import { uploadImg } from "@/app/actions/img";
import { useSession } from "next-auth/react";
import { ChangeEvent } from "react";

export default function Home() {
  const { data: session } = useSession();
  if (!session?.user) return <h1>Not Found</h1>;

  const uploadFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileData = event.target?.result;
      if (fileData) {
        const presignedURL = new URL("/api/presigned-upload", window.location.href);
        presignedURL.searchParams.set("fileName", file.name);
        presignedURL.searchParams.set("contentType", file.type);
        
        // Use original file data directly
        await fetch(presignedURL.toString(), {
  method: "PUT",
  headers: {
    "Content-Type": file.type,
  },
  body: fileData, // ArrayBuffer is valid here
});


        // console.log("File uploaded successfully");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return <input onChange={uploadFile} type="file" accept="image/*" />;
}