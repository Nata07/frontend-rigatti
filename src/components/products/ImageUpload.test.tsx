import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImageUpload } from "./ImageUpload";
import { uploadProductImage } from "../../services/uploadService";

vi.mock("../../services/uploadService", () => ({
  uploadProductImage: vi.fn(),
}));

const mockedUploadProductImage = vi.mocked(uploadProductImage);

function createImageFile(options?: { size?: number; type?: string; name?: string }) {
  const size = options?.size ?? 1024;
  const type = options?.type ?? "image/png";
  const name = options?.name ?? "product.png";

  return new File([new Uint8Array(size)], name, { type });
}

describe("ImageUpload", () => {
  beforeEach(() => {
    mockedUploadProductImage.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:preview-image"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it("renders the file input", () => {
    render(<ImageUpload onChange={vi.fn()} />);

    expect(screen.getByLabelText("Product image")).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp",
    );
  });

  it("shows a preview and uploads a valid file", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    mockedUploadProductImage.mockResolvedValue({
      imagePath: "/api/uploads/products/company-1/product.png",
      filename: "product.png",
      size: 1024,
    });

    render(<ImageUpload onChange={onChange} />);

    await user.upload(screen.getByLabelText("Product image"), createImageFile());

    expect(screen.getByRole("img", { name: "Product preview" })).toHaveAttribute(
      "src",
      "blob:preview-image",
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("/api/uploads/products/company-1/product.png");
    });
  });

  it("rejects files larger than 5 MB", async () => {
    const user = userEvent.setup();

    render(<ImageUpload onChange={vi.fn()} />);

    await user.upload(
      screen.getByLabelText("Product image"),
      createImageFile({ size: 5 * 1024 * 1024 + 1 }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Image must be 5 MB or smaller.");
    expect(mockedUploadProductImage).not.toHaveBeenCalled();
  });

  it("rejects unsupported file types", async () => {
    const user = userEvent.setup({ applyAccept: false });

    render(<ImageUpload onChange={vi.fn()} />);

    await user.upload(
      screen.getByLabelText("Product image"),
      createImageFile({ type: "image/gif", name: "product.gif" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only JPEG, PNG, and WEBP images are allowed.",
    );
    expect(mockedUploadProductImage).not.toHaveBeenCalled();
  });

  it("removes the selected image", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function ControlledImageUpload() {
      const [currentImage, setCurrentImage] = useState<string | undefined>(
        "https://example.com/legacy-image.jpg",
      );

      return (
        <ImageUpload
          currentImage={currentImage}
          onChange={(imagePath) => {
            onChange(imagePath);
            setCurrentImage(imagePath);
          }}
        />
      );
    }

    render(<ControlledImageUpload />);

    await user.click(screen.getByRole("button", { name: "Remove image" }));

    expect(screen.queryByRole("img", { name: "Product preview" })).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
