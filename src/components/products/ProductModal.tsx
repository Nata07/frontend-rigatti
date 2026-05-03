import type { Product, ProductInput } from "../../types/product";
import { ProductForm } from "./ProductForm";

interface ProductModalProps {
  isOpen: boolean;
  initialProduct?: Product | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void> | void;
}

export function ProductModal({
  isOpen,
  initialProduct,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
}: ProductModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div aria-modal="true" className="product-modal" role="dialog">
      <div className="product-modal__backdrop" onClick={onClose} />
      <div className="product-modal__panel">
        <div className="product-modal__header">
          <div>
            <span className="eyebrow">Catalog editor</span>
            <h2>{initialProduct ? "Edit product" : "Create product"}</h2>
          </div>
          <button
            aria-label="Close product form"
            className="secondary-button"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <ProductForm
          key={initialProduct?.id ?? "new-product"}
          initialProduct={initialProduct}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
