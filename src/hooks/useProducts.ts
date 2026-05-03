import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../services/productService";
import type { ProductInput } from "../types/product";

export const productsQueryKey = ["products"];

export function useProducts() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: listProducts,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: ProductInput }) =>
      updateProduct(productId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}
