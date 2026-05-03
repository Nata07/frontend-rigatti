export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imagePath?: string;
  imageUrl?: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  imagePath?: string;
  imageUrl?: string;
}
