import { extractApiErrorMessage } from "../../services/api";
import type { Product } from "../../types/product";
import { useProducts } from "../../hooks/useProducts";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  isAdmin: boolean;
  deletingProductId?: string | null;
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductGrid({
  isAdmin,
  deletingProductId = null,
  onCreate,
  onEdit,
  onDelete,
}: ProductGridProps) {
  const { data: products = [], error, isLoading } = useProducts();

  return (
    <section className="catalog-panel">
      <div className="catalog-panel__header">
        <div>
          <span className="eyebrow">Product catalog</span>
          <h2>Company inventory</h2>
          <p>Browse the live catalog and keep it current without leaving the dashboard.</p>
        </div>

        {isAdmin ? (
          <button className="primary-button" onClick={onCreate} type="button">
            New Product
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="catalog-feedback" role="status">
          Loading products...
        </div>
      ) : null}

      {error ? (
        <div className="catalog-feedback catalog-feedback--error" role="alert">
          {extractApiErrorMessage(error, "Unable to load products right now.")}
        </div>
      ) : null}

      {!isLoading && !error ? (
        products.length > 0 ? (
          <div className="product-grid" data-testid="product-grid">
            {products.map((product) => (
              <ProductCard
                isAdmin={isAdmin}
                isDeleting={deletingProductId === product.id}
                key={product.id}
                onDelete={onDelete}
                onEdit={onEdit}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-feedback">No products yet. Add one to start the catalog.</div>
        )
      ) : null}
    </section>
  );
}
