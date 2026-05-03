import { useState } from "react";

import type { Product, ProductInput } from "../../types/product";
import { ImageUpload } from "./ImageUpload";

interface ProductFormProps {
  initialProduct?: Product | null;
  isSubmitting?: boolean;
  onSubmit: (input: ProductInput) => Promise<void> | void;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  imagePath: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

function buildInitialValues(product?: Product | null): FormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    category: product?.category ?? "",
    imageUrl: product?.imageUrl ?? "",
    imagePath: product?.imagePath ?? "",
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim().length < 3) {
    errors.name = "Name must have at least 3 characters.";
  }

  if (values.description.trim().length < 10) {
    errors.description = "Description must have at least 10 characters.";
  }

  const price = Number(values.price);

  if (!values.price.trim()) {
    errors.price = "Price is required.";
  } else if (Number.isNaN(price) || price <= 0) {
    errors.price = "Price must be a positive number.";
  }

  if (!values.category.trim()) {
    errors.category = "Category is required.";
  }

  return errors;
}

export function ProductForm({
  initialProduct,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(initialProduct));
  const [errors, setErrors] = useState<FormErrors>({});

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleImageChange(imagePath?: string) {
    setValues((current) => ({
      ...current,
      imagePath: imagePath ?? "",
      imageUrl: "",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      category: values.category.trim(),
      imagePath: values.imagePath.trim() || undefined,
      imageUrl: values.imageUrl.trim() || undefined,
    });
  }

  return (
    <form className="product-form" noValidate onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          aria-invalid={Boolean(errors.name)}
          name="name"
          onChange={(event) => updateValue("name", event.target.value)}
          value={values.name}
        />
        {errors.name ? <span className="field-error">{errors.name}</span> : null}
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          aria-invalid={Boolean(errors.description)}
          name="description"
          onChange={(event) => updateValue("description", event.target.value)}
          rows={4}
          value={values.description}
        />
        {errors.description ? <span className="field-error">{errors.description}</span> : null}
      </label>

      <div className="product-form__row">
        <label className="field">
          <span>Price</span>
          <input
            aria-invalid={Boolean(errors.price)}
            inputMode="decimal"
            name="price"
            onChange={(event) => updateValue("price", event.target.value)}
            value={values.price}
          />
          {errors.price ? <span className="field-error">{errors.price}</span> : null}
        </label>

        <label className="field">
          <span>Category</span>
          <input
            aria-invalid={Boolean(errors.category)}
            name="category"
            onChange={(event) => updateValue("category", event.target.value)}
            value={values.category}
          />
          {errors.category ? <span className="field-error">{errors.category}</span> : null}
        </label>
      </div>

      <ImageUpload
        currentImage={values.imagePath || values.imageUrl}
        disabled={isSubmitting}
        onChange={handleImageChange}
      />

      <div className="product-form__actions">
        <button className="secondary-button" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : initialProduct ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
