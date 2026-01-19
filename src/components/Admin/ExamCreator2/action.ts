

import { uploadImgDB } from "@/app/actions/img";

export const uploadFileToS3 = async (file: File): Promise<string | null> => {
    if (!file) return null;

    try {
      const presignedURL = new URL(
        "/api/presigned-upload",
        window.location.href
      );
      presignedURL.searchParams.set("fileName", file.name);
      presignedURL.searchParams.set("contentType", file.type);

      const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const imageUrl = await uploadImgDB(
        presignedURL.toString(),
        fileData,
        file
      );

      // console.log('image Url : ',imageUrl);

      return imageUrl || null;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
};
