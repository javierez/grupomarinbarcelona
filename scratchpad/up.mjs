import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
const Bucket = "vesta-crm-prod-eu-e966e353";
const Key = "accounts/103/website/footer/kit-digital-logos.png";
const s3 = new S3Client({ region: "eu-west-1", credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
await s3.send(new PutObjectCommand({ Bucket, Key, Body: readFileSync(process.argv[2]), ContentType: "image/png", CacheControl: "public, max-age=31536000" }));
console.log(`https://${Bucket}.s3.eu-west-1.amazonaws.com/${Key}`);
