import OpenAI from "openai";
import sql from "./../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import FormData from "form-data";

const AI = new OpenAI({
  apiKey: process.env.NEXORA_GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    if (!length || typeof length !== "number") {
      return res.status(400).json({
        success: false,
        message: "Valid length is required",
      });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate content.",
      error: error.message,
    });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate content.",
      error: error.message,
    });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql` INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${
      publish ?? false
    })`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate image.",
      error: error.message,
    });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove background.",
      error: error.message,
    });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`,
        },
      ],
      resource_type: "image",
    });

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove image object.",
      error: error.message,
    });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`;

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to review resume.",
      error: error.message,
    });
  }
};

export const enhanceImage = async (req, res) => {
  try {
      const { userId } = req.auth();
    const { enhancedImageUrl, publish } = req.body; 
    const plan = req.plan;
    const free_usage = req.free_usage;


    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }
    
    if (!enhancedImageUrl) {
      return res.status(400).json({
        success: false,
        message: "Enhanced image URL is required",
      });
    }

    console.log("Uploading enhanced image to Cloudinary:", enhancedImageUrl);

    const { secure_url } = await cloudinary.uploader.upload(enhancedImageUrl, {
      folder: "enhanced-images",
      resource_type: "image",
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish) 
      VALUES (${userId}, 'Enhanced image using AI', ${secure_url}, 'enhanced-image', ${
      publish ?? false
    })
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({
      success: true,
      content: secure_url,
      message: "Image enhanced and saved successfully!",
    });
  } catch (error) {
    console.error("Enhancement error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to enhance image.",
    });
  }
};

// Helper function to enhance image
// const enhanceImageWithAPI = async (file) => {
//   try {
//     const taskId = await createEnhancementTask(file);
//     const enhancedImageUrl = await pollForEnhancementResult(taskId);
//     return enhancedImageUrl;
//   } catch (error) {
//     throw new Error(`Enhancement failed: ${error.message}`);
//   }
// };

// // Helper function to create enhancement task
// const createEnhancementTask = async (file) => {
//   const formData = new FormData();

//   formData.append("image_file", fs.createReadStream(file.path), {
//     filename: file.originalname,
//     contentType: file.mimetype,
//   });
//   formData.append("sync", "0");
//   formData.append("return_type", "1");
//   formData.append("scale_factor", "1");

//   try {
//     const response = await axios.post(
//       `${process.env.PICWISH_BASE_URL}/api/tasks/visual/scale`,
//       formData,
//       {
//         headers: {
//           "X-API-KEY": process.env.PICWISH_API_KEY,
//           ...formData.getHeaders(),
//         },
//         timeout: 60000,
//         maxContentLength: 50 * 1024 * 1024, // 50MB
//         maxBodyLength: 50 * 1024 * 1024,
//       }
//     );

//     if (response.data?.data?.task_id) {
//       return response.data.data.task_id;
//     }

//     throw new Error("Failed to create enhancement task");
//   } catch (error) {
//     console.error("Task creation error:", error.message);
//     if (error.code === "ECONNABORTED") {
//       throw new Error(
//         "Request timeout - the image might be too large or the service is busy"
//       );
//     }
//     if (error.response) {
//       throw new Error(
//         `API Error: ${error.response.status} - ${JSON.stringify(
//           error.response.data
//         )}`
//       );
//     }
//     throw new Error(`Network Error: ${error.message}`);
//   }
// };

// // // Helper function to poll for enhancement result
// const pollForEnhancementResult = async (taskId, maxAttempts = 60) => {
//   const delay = 3000;

//   for (let attempt = 0; attempt < maxAttempts; attempt++) {
//     try {
//       const response = await axios.get(
//         `${process.env.PICWISH_BASE_URL}/api/tasks/visual/scale/${taskId}`,
//         {
//           headers: { "X-API-KEY": process.env.PICWISH_API_KEY },
//           timeout: 15000,
//         }
//       );

//       const { progress, state, image } = response.data.data;

//       // Check for failure
//       if (state < 0) {
//         const errorMessages = {
//           "-8": "Processing timeout. Try a smaller image.",
//           "-7": "Image exceeds resolution limit or unsupported format.",
//           "-5": "Image exceeds size limit.",
//           "-3": "Failed to download image.",
//           "-2": "Processing completed but result upload failed.",
//           "-1": "Task failed due to unknown error.",
//           0: "Too many requests. Please try again later.",
//         };
//         throw new Error(
//           errorMessages[state.toString()] ||
//             `Enhancement failed (state: ${state})`
//         );
//       }

//       // Check if complete
//       if (progress >= 100 && image) {
//         return image;
//       }

//       // Wait before next poll
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     } catch (error) {
//       if (error.response) {
//         console.error("Polling error:", error.response.data);
//         throw new Error(`API Error: ${error.response.status}`);
//       }
//       throw error;
//     }
//   }

//   throw new Error("Enhancement timeout. Please try again later.");
// };
