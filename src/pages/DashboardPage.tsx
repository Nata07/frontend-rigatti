import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../contexts/useAuth";
import { VerificationBanner } from "../components/VerificationBanner";
import { ChatPanel } from "../components/chat/ChatPanel";
import { ProductGrid } from "../components/products/ProductGrid";
import { ProductModal } from "../components/products/ProductModal";
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "../hooks/useProducts";
import { extractApiErrorMessage } from "../services/api";
import type { Product, ProductInput } from "../types/product";

export function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  function openCreateModal() {
    setEditingProduct(null);
    setMutationError(null);
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setMutationError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (createProduct.isPending || updateProduct.isPending) {
      return;
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setMutationError(null);
  }

  async function handleProductSubmit(input: ProductInput) {
    try {
      setMutationError(null);

      if (editingProduct) {
        await updateProduct.mutateAsync({
          productId: editingProduct.id,
          input,
        });
      } else {
        await createProduct.mutateAsync(input);
      }

      closeModal();
    } catch (error) {
      setMutationError(extractApiErrorMessage(error, "Unable to save the product right now."));
    }
  }

  async function handleDeleteProduct(product: Product) {
    const shouldDelete = window.confirm(`Delete "${product.name}" from the catalog?`);

    if (!shouldDelete) {
      return;
    }

    try {
      setMutationError(null);
      await deleteProduct.mutateAsync(product.id);
    } catch (error) {
      setMutationError(
        extractApiErrorMessage(error, "Unable to delete the product right now."),
      );
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header">
        <div>
          <span className="eyebrow">Unified dashboard</span>
          <h1>Manage the catalog without losing the customer view.</h1>
          <p>
            The product grid is live for every authenticated user. Admins can create, edit, and
            delete items inline while regular users keep a clean read-only catalog view.
          </p>
        </div>

        <div className="dashboard-header__actions">
          <div className="dashboard-pill-list" data-testid="dashboard-role-summary">
            <span className="dashboard-pill">{user?.name || "Authenticated user"}</span>
            <span className="dashboard-pill dashboard-pill--muted">
              {isAdmin ? "Admin access" : "Read-only access"}
            </span>
          </div>
          <button className="secondary-button" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </section>

      {mutationError ? (
        <p className="form-error dashboard-error-banner" role="alert">
          {mutationError}
        </p>
      ) : null}

      {user ? <VerificationBanner user={user} /> : null}

      <div className="dashboard-layout" data-testid="dashboard-layout">
        <div className="dashboard-main">
          <ProductGrid
            deletingProductId={deleteProduct.isPending ? deleteProduct.variables : null}
            isAdmin={isAdmin}
            onCreate={openCreateModal}
            onDelete={handleDeleteProduct}
            onEdit={openEditModal}
          />
        </div>

        <ChatPanel />
      </div>

      <ProductModal
        errorMessage={mutationError}
        initialProduct={editingProduct}
        isOpen={isModalOpen}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
        onClose={closeModal}
        onSubmit={handleProductSubmit}
      />
    </main>
  );
}
