import { describe, expect, it, vi } from "vitest";

import { api } from "./api";
import { uploadProductImage } from "./uploadService";

describe("uploadService", () => {
  it("uploads the file to the product image endpoint and reports progress", async () => {
    const file = new File([new Uint8Array(1024)], "product.png", { type: "image/png" });
    const onProgress = vi.fn();

    const postSpy = vi.spyOn(api, "post").mockImplementation(async (_url, _body, config) => {
      config?.onUploadProgress?.({ loaded: 3, total: 4 } as never);

      return {
        data: {
          imagePath: "/api/uploads/products/company-1/product.png",
          filename: "product.png",
          size: 1024,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as never,
      };
    });

    const result = await uploadProductImage(file, onProgress);

    expect(postSpy).toHaveBeenCalledWith(
      "/uploads/product-image",
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );

    const formData = postSpy.mock.calls[0]?.[1];
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("image")).toBe(file);
    expect(onProgress).toHaveBeenCalledWith(75);
    expect(result.imagePath).toBe("/api/uploads/products/company-1/product.png");
  });
});
