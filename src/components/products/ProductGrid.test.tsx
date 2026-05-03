import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/utils";
import type { Product } from "../../types/product";
import { ProductGrid } from "./ProductGrid";

vi.mock("../../hooks/useProducts", () => ({
  useProducts: vi.fn(),
}));

import { useProducts } from "../../hooks/useProducts";

const products: Product[] = [
  {
    id: "product-1",
    name: "Aurora Lamp",
    description: "Hand-finished desk lamp with warm brass details.",
    price: 149.9,
    category: "lighting",
    imageUrl: "https://example.com/lamp.jpg",
  },
];

describe("ProductGrid", () => {
  it("renders a list of products", () => {
    vi.mocked(useProducts).mockReturnValue({
      data: products,
      error: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useProducts>);

    renderWithProviders(
      <ProductGrid
        isAdmin={true}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Aurora Lamp")).toBeInTheDocument();
    expect(screen.getByText("$149.90")).toBeInTheDocument();
  });

  it("shows a loading state during fetch", () => {
    vi.mocked(useProducts).mockReturnValue({
      data: [],
      error: null,
      isLoading: true,
    } as unknown as ReturnType<typeof useProducts>);

    renderWithProviders(
      <ProductGrid
        isAdmin={false}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading products...");
  });
});
