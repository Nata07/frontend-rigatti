import { api } from "./api";
import type { Product, ProductInput } from "../types/product";

interface ProductResponse {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imagePath?: string;
  imageUrl?: string;
}

function normalizeProduct(product: ProductResponse): Product {
  return {
    id: product.id ?? product._id ?? "",
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    imagePath: product.imagePath,
    imageUrl: product.imageUrl,
  };
}

export async function listProducts() {
  const response = await api.get<ProductResponse[]>("/products");
  return response.data.map(normalizeProduct);
}

export async function createProduct(input: ProductInput) {
  const response = await api.post<ProductResponse>("/products", input);
  return normalizeProduct(response.data);
}

export async function updateProduct(productId: string, input: ProductInput) {
  const response = await api.put<ProductResponse>(`/products/${productId}`, input);
  return normalizeProduct(response.data);
}

export async function deleteProduct(productId: string) {
  await api.delete(`/products/${productId}`);
}
