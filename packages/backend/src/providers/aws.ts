import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const {
  AWS_REGION,
  AWS_ENDPOINT,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET,
} = process.env;

const s3Client = new S3Client({
  region: AWS_REGION as string,
  endpoint: AWS_ENDPOINT as string,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID as string,
    secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
  },
});

export const generateUploadUrl = async (
  fileKey: string
): Promise<string | null> => {
  try {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET as string,
      Key: fileKey,
      ACL: "public-read",
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    return uploadUrl;
  } catch (e) {
    console.error(e);
    return null;
  }
};
