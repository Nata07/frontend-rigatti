import type { AxiosProgressEvent } from "axios";

import { api } from "./api";

export interface UploadProductImageResult {
  imagePath: string;
  filename: string;
  size: number;
}

export async function uploadProductImage(
  file: File,
  onProgress?: (progress: number) => void,
) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post<UploadProductImageResult>("/uploads/product-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress(event: AxiosProgressEvent) {
      if (!event.total || !onProgress) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  return response.data;
}
