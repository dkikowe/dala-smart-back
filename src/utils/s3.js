import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import sharp from "sharp";

const region = process.env.AWS_REGION || "eu-north-1";
const bucket = process.env.AWS_BUCKET_NAME || "dala-smart-animals";

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// Ensure bucket exists; create it on first run.
export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✅ S3 bucket "${bucket}" ready`);
  } catch (err) {
    const status = err.$metadata?.httpStatusCode;

    // 403 = bucket exists but HeadBucket IAM permission denied — safe to proceed.
    if (status === 403) {
      console.warn(`⚠️  S3 HeadBucket 403 — assuming bucket "${bucket}" already exists`);
      return;
    }

    if (err.name === "NotFound" || status === 404) {
      const createParams = { Bucket: bucket };
      if (region !== "us-east-1") {
        createParams.CreateBucketConfiguration = { LocationConstraint: region };
      }
      await s3.send(new CreateBucketCommand(createParams));
      await s3.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT"],
                AllowedOrigins: ["*"],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        }),
      );
      console.log(`✅ S3 bucket "${bucket}" created in ${region}`);
    } else {
      // Non-critical — log but don't crash the server.
      console.error(`⚠️  ensureBucket failed (${status ?? err.name}):`, err.message);
    }
  }
}

/**
 * Compress and upload an image buffer to S3.
 * Returns the public HTTPS URL of the uploaded object.
 *
 * @param {Buffer} inputBuffer  Raw file bytes from multer
 * @param {string} key          S3 object key  (e.g. "animals/ownerId/animalId.jpg")
 * @param {string} [mimeType]   Original MIME type
 */
export async function uploadImage(inputBuffer, key, mimeType = "image/jpeg") {
  // Compress: max 1 200 px wide, JPEG 82 % quality, strip EXIF.
  const compressed = await sharp(inputBuffer)
    .rotate()
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 35, progressive: false, mozjpeg: true })
    .toBuffer();

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: compressed,
      ContentType: "image/jpeg",
    },
  });

  await upload.done();

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export { bucket };
