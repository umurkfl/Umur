import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadReceiptImage(
  base64Data: string,
  mediaType: string
): Promise<{ url: string; publicId: string }> {
  const dataUri = `data:${mediaType};base64,${base64Data}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "adisyon/receipts",
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteReceiptImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}
