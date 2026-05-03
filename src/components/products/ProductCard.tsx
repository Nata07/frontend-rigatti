import type { Product } from "../../types/product";

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  isDeleting?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function ProductCard({
  product,
  isAdmin,
  isDeleting = false,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const imageSource = product.imagePath ?? product.imageUrl;

  return (
    <article className="product-card">
      <div className="product-card__media">
        {imageSource ? (
          <img alt={product.name} className="product-card__image" src={imageSource} />
        ) : (
          <div className="product-card__placeholder" aria-label={`${product.name} placeholder image`}>
            {product.category}
          </div>
        )}
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__category">{product.category}</span>
          <strong className="product-card__price">{formatPrice(product.price)}</strong>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>

        {isAdmin ? (
          <div className="product-card__actions">
            <button
              className="secondary-button"
              onClick={() => onEdit?.(product)}
              type="button"
            >
              Edit
            </button>
            <button
              className="danger-button"
              disabled={isDeleting}
              onClick={() => onDelete?.(product)}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
