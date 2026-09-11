import * as Minio from "minio";
import "dotenv/config";

const endPoint = process.env.MINIO_ENDPOINT || "localhost";
const port = parseInt(process.env.MINIO_PORT || "9000", 10);
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "kependudukan";

export const minioClient = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey,
});

export async function initMinioBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' berhasil dibuat.`);
    }

    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/penduduk/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  } catch (error) {
    console.error("[MinIO] Gagal menginisialisasi bucket MinIO:", error);
  }
}

export async function uploadFotoPenduduk(
  pendudukId: string,
  buffer: Buffer,
  mimeType: string,
  extension: string
): Promise<string> {
  const cleanExt = extension.startsWith(".") ? extension.slice(1) : extension;
  const objectKey = `penduduk/${pendudukId}-${Date.now()}.${cleanExt}`;

  await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
    "Content-Type": mimeType,
  });

  return objectKey;
}

export async function deleteFotoPenduduk(objectKey: string): Promise<void> {
  if (!objectKey) return;
  try {
    await minioClient.removeObject(BUCKET_NAME, objectKey);
  } catch (error) {
    console.error(`[MinIO] Gagal menghapus foto '${objectKey}':`, error);
  }
}

export function getPublicFotoUrl(objectKey: string | null | undefined): string | null {
  if (!objectKey) return null;
  const publicBaseUrl = process.env.MINIO_PUBLIC_URL || `http://${endPoint}:${port}/${BUCKET_NAME}`;
  return `${publicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
}
