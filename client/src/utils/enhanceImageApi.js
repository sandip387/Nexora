import axios from "axios";

const API_KEY = import.meta.env.VITE_ENHANCE_API_KEY;
const BASE_URL = import.meta.env.VITE_ENHANCE_BASE_URL;
const BACKEND_URL = import.meta.env.VITE_BASE_URL;

const POLLING_DELAY = 2000;
const MAX_TIMEOUT = 120000;
const MAX_DIMENSION = 4096;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIN_FILE_SIZE = 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
];

const ERROR_MESSAGES = {
  "-8": "Processing timeout. Try a smaller image.",
  "-7": "Image exceeds resolution limit or unsupported format.",
  "-5": "Image exceeds size limit (15MB maximum).",
  "-3": "Failed to download image from URL.",
  "-2": "Processing completed but result upload failed.",
  "-1": "Task failed due to unknown error.",
  0: "Too many requests. Your task is in queue.",
};

const validateImageFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return `Unsupported file format: ${file.type}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(
      1
    )}MB. Maximum: 15MB`;
  }

  if (file.size < MIN_FILE_SIZE) {
    return "File too small. Please select a valid image file.";
  }

  return null;
};

const validateImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        resolve({
          valid: false,
          error: `Image too large: ${width}x${height}. Maximum: ${MAX_DIMENSION}x${MAX_DIMENSION}`,
          dimensions: { width, height },
        });
      } else {
        resolve({ valid: true, dimensions: { width, height } });
      }

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      resolve({ valid: false, error: "Could not read image dimensions" });
    };

    img.src = URL.createObjectURL(file);
  });
};

const resizeImage = (file, maxDimension = MAX_DIMENSION) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;

      if (width <= maxDimension && height <= maxDimension) {
        resolve(file);
        return;
      }

      const ratio = Math.min(maxDimension / width, maxDimension / height);
      const newWidth = Math.floor(width * ratio);
      const newHeight = Math.floor(height * ratio);

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        file.type,
        0.9
      );

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

const createTask = async (file) => {
  const formData = new FormData();
  formData.append("image_file", file);
  formData.append("sync", "0");
  formData.append("return_type", "1");
  formData.append("scale_factor", "1");

  try {
    const response = await axios.post(
      `${BASE_URL}/api/tasks/visual/scale`,
      formData,
      {
        headers: { "X-API-KEY": API_KEY },
        timeout: 30000,
        maxContentLength: 16 * 1024 * 1024,
        maxBodyLength: 16 * 1024 * 1024,
      }
    );

    if (response.data?.data?.task_id) {
      return response.data.data.task_id;
    }

    throw new Error("Failed to create task: " + JSON.stringify(response.data));
  } catch (error) {
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw new Error(`Network Error: ${error.message}`);
  }
};

const getTaskResult = async (taskId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/tasks/visual/scale/${taskId}`,
      {
        headers: { "X-API-KEY": API_KEY },
        timeout: 10000,
      }
    );

    if (!response.data?.data) {
      throw new Error("No data in response");
    }

    const { progress, state, image } = response.data.data;

    if (state < 0) {
      const errorMessage =
        ERROR_MESSAGES[state.toString()] || `Unknown error (state: ${state})`;
      throw new Error(errorMessage);
    }

    if (progress >= 100 && image) {
      return response.data;
    }

    throw { continue: true, progress };
  } catch (error) {
    if (error.continue) {
      throw error;
    }
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw new Error(`Network Error: ${error.message}`);
  }
};

const polling = async (
  fn,
  onProgress,
  delay = POLLING_DELAY,
  timeout = MAX_TIMEOUT
) => {
  const startTime = Date.now();

  const poll = async () => {
    try {
      return await fn();
    } catch (error) {
      if (error.continue) {
        if (onProgress && typeof error.progress === "number") {
          onProgress(error.progress);
        }

        if (Date.now() - startTime >= timeout) {
          throw new Error("Enhancement timeout. Please try again later.");
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return poll();
      }
      throw error;
    }
  };

  return poll();
};

export const saveToBackend = async (enhancedImageUrl, publish, getToken) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/ai/enhance-image`,
      { enhancedImageUrl, publish },
      {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          "Content-Type": "multipart/form-data",
        },
        // timeout: 300000,
      }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to save enhance image");
    }
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || "Network error occurred");
  }
};

export const enhanceImageAPI = async (
  file,
  publish = false,
  onProgress,
  getToken
) => {
  try {
    // Step 1: Basic validation
    const validationError = validateImageFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Step 2: Check dimensions and resize if needed
    const dimensionCheck = await validateImageDimensions(file);
    let processedFile = file;

    if (!dimensionCheck.valid) {
      processedFile = await resizeImage(file);

      const resizedCheck = await validateImageDimensions(processedFile);
      if (!resizedCheck.valid) {
        throw new Error("Failed to resize image to acceptable dimensions");
      }
    }

    // Step 3: Enhance with third-party API
    const taskId = await createTask(processedFile);
    const result = await polling(() => getTaskResult(taskId), onProgress);

    // Step 4: Save to your backend (this handles auth, DB, Cloudinary)
    const backendResult = await saveToBackend(
      result.data.image,
      publish,
      getToken
    );

    return backendResult;
  } catch (error) {
    throw error;
  }
};
