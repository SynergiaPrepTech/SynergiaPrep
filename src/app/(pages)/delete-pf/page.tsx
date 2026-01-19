"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { deleteServerSide } from "@/app/actions/img";
function getFileName(url: string): string {
  const pos = url.lastIndexOf("/");
  return pos !== -1 ? url.substring(pos + 1) : "";
}

export default function Page() {
  const { data: session } = useSession();
  
  if (!session?.user?.image) return <h1>Not Found</h1>;
  const fileName = getFileName(session.user.image);
  // async function DeleteImg(presignedURL: string) {
  //   const res = await fetch(
  //     presignedURL.toString()
  //   );
  //   const data = await res.json();
  //   console.log(data);
  //   if (!data.signedUrl) return false;

  //   const res1 = await fetch(data.signedUrl, {
  //     method: "DELETE",
  //   });
  //   console.log(res1);

  //   if (res1.ok) {
  //     console.log("File deleted");
  //     dbUpdateImgUsingId(session?.user?.id, {
  //       image: null,
  //     });
  //     console.log("Image URL delete");
  //   }
  //   return true;
  // }

  return (
    <>
      {session.user.image !== "" && (
        <Image
          src={session.user.image}
          alt="profile"
          width={300}
          height={300}
        />
      )}
      <h1>{session.user.image}</h1>
      <button
        onClick={async () => {
          const presignedURL = new URL(
            "/api/presigned-delete",
            window.location.href
          );
          presignedURL.searchParams.set("fileName", fileName);
          // const check = await DeleteImg(presignedURL.toString());
          const serverSide = await deleteServerSide(
            presignedURL.toString(),
            window.location.origin
          );
          // console.log(serverSide);
          if (serverSide) {
            // console.log("File deleted successfully");
          } else {
            console.log("File delete failed");
          }
        }}
        className="bg-red-500"
      >
        click to delete pf
      </button>
    </>
  );
}
