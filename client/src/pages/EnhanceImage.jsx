import { Sparkles, Download, RotateCcw, Wand2, Globe } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { enhanceImageAPI } from "../utils/enhanceImageApi";
import { useAuth } from "@clerk/clerk-react";

function EnhanceImage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPublic, setIsPublic] = useState(false);

  const { getToken } = useAuth();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setSelectedFile(file);
    setOriginalImage(URL.createObjectURL(file));
    setEnhancedImage("");
  };

  const handleEnhance = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const result = await enhanceImageAPI(
        selectedFile,
        isPublic,
        setProgress,
        getToken
      );

      if (result?.content) {
        setEnhancedImage(result.content);
        toast.success(result.message || "Image enhanced successfully!");
      } else {
        throw new Error("No enhanced image received");
      }
    } catch (error) {
      toast.error(error.message || "Failed to enhance image");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOriginalImage(null);
    setEnhancedImage(null);
    setLoading(false);
    setProgress(0);
    setIsPublic(false);
  };

  const handleDownload = () => {
    if (enhancedImage) {
      const link = document.createElement("a");
      link.href = enhancedImage;
      link.download = `enhanced-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded!");
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* Left column */}
      <form
        onSubmit={handleEnhance}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-xl font-semibold ">AI Image Enhancement</h1>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input
            onChange={handleImageSelect}
            type="file"
            accept="image/*"
            className="w-full p-2 px-3 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
            required
          />
          <p className="text-xs text-gray-500 font-light mt-1">
            Supports JPG, PNG, WEBP (Max 15MB). Large images auto-resized to
            4096x4096.
          </p>
        </div>

        {/* Original Image Preview */}
        {originalImage && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Original Image Preview:</p>
            <img
              src={originalImage}
              alt="Original preview"
              className="w-full max-h-32 object-contain rounded-md border border-gray-200"
            />
          </div>
        )}

        {/* Publish Option */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Make this creation public
            </span>
          </label>
        </div>

        <button
          disabled={loading || !selectedFile}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-5" />
              Enhance Image
            </>
          )}
        </button>

        {/* Action Buttons */}
        {(originalImage || enhancedImage) && (
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            {enhancedImage && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        )}
      </form>

      {/* Right Column*/}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
        <div className="flex items-center gap-3">
          <Wand2 className="w-5 h-5 text-[#FF6B6B]" />
          <h1 className="text-xl font-semibold">Enhanced Result</h1>
        </div>

        {!enhancedImage && !loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Wand2 className="w-9 h-9" />
              <p>Upload an image and click "Enhance Image" to get started</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 mb-2">
                Enhancing your image...
              </p>
              <p className="text-xs text-gray-500">
                This may take a few moments...
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex-1 overflow-hidden">
            <img
              src={enhancedImage}
              alt="Enhanced result"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhanceImage;
