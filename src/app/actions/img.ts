"use server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { auth } from "@/auth";
import { dbUpdateImgUsingId } from "@/app/actions/data";
import { getCookie } from "./server-cookie-jwt";
import { revalidateTag } from "next/cache";

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return arrayBuffer as ArrayBuffer;
}

export async function uploadImg(signedUrl: string, fileData: Buffer<ArrayBufferLike>, file: File) {
  const session = await auth();
  if (!session?.user) return false;
  const cookie = await getCookie();
  
  const res = await fetch(signedUrl.toString(), {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "Cookie": cookie
    }
  }); 

  const data = await res.json();
  // console.log(data);
  if(!data.signedUrl) return false;

  // Preserve original image quality - use original file data directly
  const originalFile = new Uint8Array(fileData);
  const body = new Blob([originalFile], { type: file.type });
  
  const res1 = await fetch(data.signedUrl, {
    body,
    method: "PUT",
  });
  
  // console.log(res1);
  if (res1.ok) {
    // console.log("File uploaded with original quality");
    // Update database with the image URL
    dbUpdateImgUsingId(session?.user?.id, {
      image: data.signedUrl.split('?')[0] as string
    });
    // console.log("Image URL updated");
  }
  return true;
}

export async function uploadImgDB(signedUrl: string, fileData: ArrayBuffer, file: File) {
  const session = await auth();
  if (!session?.user) return false;
  const cookie = await getCookie();
  
  const res = await fetch(signedUrl.toString(), {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "Cookie": cookie
    }
  }); 

  const data = await res.json();
  // console.log(data);
  if(!data.signedUrl) return false;

  // Preserve original quality - use the file data as-is
  const originalFile = new Uint8Array(fileData);
  const body = new Blob([originalFile], { type: file.type });

  let imageUrl;  
  const res1 = await fetch(data.signedUrl, {
    body,
    method: "PUT",
  });
  
  console.log(res1);
  if (res1.ok) {
    // console.log("File uploaded with original quality");
    imageUrl = data.signedUrl.split('?')[0];
    // console.log("Image URL updated");
  }
  
  return imageUrl;
}

export async function deleteImageDB(signedUrl: string) {
  const session = await auth();
  if (!session?.user) return false;
  const cookie = await getCookie();
  
  const res = await fetch(signedUrl.toString(), {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "Cookie": cookie
    },
    cache: "no-store"
  }); 

  const data = await res.json();
  // console.log(data);
  if(!data.signedUrl) return false;
    
  const res1 = await fetch(data.signedUrl, {
    method: "DELETE",
  });

  if (res1.ok) {
    return true;
  }
  return false;
}

// REMOVED: getResizedImage function that was degrading quality
// If you need image processing, create a separate function that preserves quality

export async function preserveImageQuality(fileData: ArrayBuffer): Promise<ArrayBuffer> {
  // If you need to process images while preserving quality, you can use:
  // return sharp(fileData)
  //   .withMetadata() // Preserve metadata
  //   .toBuffer();
  
  // For maximum preservation, return original data
  return fileData;
}

export async function deleteServerSide(signedUrl: string, origin: string) {
  const session = await auth();
  if (!session?.user) return false;
  const cookie = await getCookie();
  
  const res = await fetch(signedUrl.toString(), {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "Cookie": cookie
    },
    cache: "no-store"
  }); 

  const data = await res.json();
  // console.log(data);
  if(!data.signedUrl) return false;
    
  const res1 = await fetch(data.signedUrl, {
    method: "DELETE",
  });
  
  // console.log(res1);
  if (res1.ok) {
    console.log("File deleted");
    dbUpdateImgUsingId(session?.user?.id, {
      image: null
    });
    console.log("Image URL deleted");
  }
  
  revalidateTag(session.user.image);
  return true;
}