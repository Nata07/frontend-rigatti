import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductForm } from "./ProductForm";
import { uploadProductImage } from "../../services/uploadService";

vi.mock("../../services/uploadService", () => ({
  uploadProductImage: vi.fn(),
}));

const mockedUploadProductImage = vi.mocked(uploadProductImage);

function createImageFile() {
  return new File([new Uint8Array(1024)], "product.png", { type: "image/png" });
}

describe("ProductForm", () => {
  beforeEach(() => {
    mockedUploadProductImage.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:product-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ProductForm onCancel={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(screen.getByText("Name must have at least 3 characters.")).toBeInTheDocument();
    expect(screen.getByText("Description must have at least 10 characters.")).toBeInTheDocument();
    expect(screen.getByText("Price is required.")).toBeInTheDocument();
    expect(screen.getByText("Category is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates price as a positive number", async () => {
    const user = userEvent.setup();

    render(<ProductForm onCancel={vi.fn()} onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Desk Lamp");
    await user.type(screen.getByLabelText("Description"), "Detailed lamp for reading time.");
    await user.type(screen.getByLabelText("Price"), "-10");
    await user.type(screen.getByLabelText("Category"), "Lighting");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(screen.getByText("Price must be a positive number.")).toBeInTheDocument();
  });

  it("submits the uploaded imagePath with the product data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    mockedUploadProductImage.mockResolvedValue({
      imagePath: "/api/uploads/products/company-1/product.png",
      filename: "product.png",
      size: 1024,
    });

    render(<ProductForm onCancel={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Desk Lamp");
    await user.type(screen.getByLabelText("Description"), "Detailed lamp for reading time.");
    await user.type(screen.getByLabelText("Price"), "120");
    await user.type(screen.getByLabelText("Category"), "Lighting");
    await user.upload(screen.getByLabelText("Product image"), createImageFile());
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Desk Lamp",
      description: "Detailed lamp for reading time.",
      price: 120,
      category: "Lighting",
      imagePath: "/api/uploads/products/company-1/product.png",
      imageUrl: undefined,
    });
  });

  it("shows upload progress and errors from the upload flow", async () => {
    const user = userEvent.setup();
    let rejectUpload: ((reason?: unknown) => void) | undefined;

    mockedUploadProductImage.mockImplementation(
      (_file, onProgress) =>
        new Promise((_, reject) => {
          rejectUpload = reject;
          onProgress?.(55);
        }),
    );

    render(<ProductForm onCancel={vi.fn()} onSubmit={vi.fn()} />);

    await user.upload(screen.getByLabelText("Product image"), createImageFile());

    expect(screen.getByText("Uploading... 55%")).toBeInTheDocument();

    rejectUpload?.({
      response: {
        data: {
          message: "Upload failed on server",
        },
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed on server");
  });

  it("shows upload errors when the backend rejects the file", async () => {
    const user = userEvent.setup();

    mockedUploadProductImage.mockImplementation(async (_file, onProgress) => {
      onProgress?.(55);
      throw {
        response: {
          data: {
            message: "Upload failed on server",
          },
        },
      };
    });

    render(<ProductForm onCancel={vi.fn()} onSubmit={vi.fn()} />);

    await user.upload(screen.getByLabelText("Product image"), createImageFile());

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed on server");
  });

  it("keeps legacy imageUrl values for existing products until removed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ProductForm
        initialProduct={{
          id: "product-1",
          name: "Desk Lamp",
          description: "Detailed lamp for reading time.",
          price: 120,
          category: "Lighting",
          imageUrl: "https://example.com/legacy-image.jpg",
        }}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("img", { name: "Product preview" })).toHaveAttribute(
      "src",
      "https://example.com/legacy-image.jpg",
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Desk Lamp",
      description: "Detailed lamp for reading time.",
      price: 120,
      category: "Lighting",
      imagePath: undefined,
      imageUrl: "https://example.com/legacy-image.jpg",
    });
  });
});
