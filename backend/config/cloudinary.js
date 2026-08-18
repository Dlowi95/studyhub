const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const isPlaceholderValue = (value) =>
  typeof value !== "string" ||
  value.trim() === "" ||
  /your_|example_|placeholder|changeme/i.test(value.trim());

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured =
  Boolean(cloudName) &&
  Boolean(apiKey) &&
  Boolean(apiSecret) &&
  !isPlaceholderValue(cloudName) &&
  !isPlaceholderValue(apiKey) &&
  !isPlaceholderValue(apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn("Cloudinary is not configured. Falling back to local file storage for uploads.");
}

module.exports = Object.assign(cloudinary, { isConfigured });