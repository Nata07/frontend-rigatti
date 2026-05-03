import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductCard } from "./ProductCard";

const product = {
  id: "product-1",
  name: "Aurora Lamp",
  description: "Hand-finished desk lamp with warm brass details.",
  price: 149.9,
  category: "lighting",
  imagePath: "/api/uploads/products/company-1/lamp.jpg",
  imageUrl: "https://example.com/legacy-lamp.jpg",
};

describe("ProductCard", () => {
  it("renders product data correctly", () => {
    render(<ProductCard isAdmin={false} product={product} />);

    expect(screen.getByRole("img", { name: "Aurora Lamp" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Aurora Lamp" })).toHaveAttribute(
      "src",
      "/api/uploads/products/company-1/lamp.jpg",
    );
    expect(screen.getByText("Aurora Lamp")).toBeInTheDocument();
    expect(screen.getByText("$149.90")).toBeInTheDocument();
    expect(screen.getByText("lighting")).toBeInTheDocument();
  });

  it("falls back to legacy imageUrl when imagePath is not present", () => {
    render(
      <ProductCard
        isAdmin={false}
        product={{
          ...product,
          imagePath: undefined,
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Aurora Lamp" })).toHaveAttribute(
      "src",
      "https://example.com/legacy-lamp.jpg",
    );
  });

  it("shows admin controls when the user is an admin", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard isAdmin={true} onDelete={onDelete} onEdit={onEdit} product={product} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledWith(product);
    expect(onDelete).toHaveBeenCalledWith(product);
  });

  it("hides admin controls for regular users", () => {
    render(<ProductCard isAdmin={false} product={product} />);

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
