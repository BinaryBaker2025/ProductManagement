import { useEffect, useRef, useState } from "react";
import "./App.css";
import productsJson from "./mockData.json";

const SORT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const PRODUCT_STATUSES = ["active", "inactive", "pending", "archived"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [failedLoad, setFailedLoad] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortedPrice, setSortedPrice] = useState("none");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("active");
  const [flashMessage, setFlashMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showFormErrors, setShowFormErrors] = useState(false);

  const selectAllRef = useRef(null);


  //Loads data from mockData file with a 1200ms delay 
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setErrorMsg("");

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        if (failedLoad) {
          throw new Error("Failed to load products.");
        }

        let data = [];

        if (Array.isArray(productsJson)) {
          data = productsJson;
        } else if (productsJson && Array.isArray(productsJson.products)) {
          data = productsJson.products;
        } else {
          throw new Error("Invalid data format.");
        }

        setProducts(data);
      } catch (error) {
        setProducts([]);
        setErrorMsg(error instanceof Error ? error.message : "Unknown error.");
      } finally {
        setIsLoading(false);
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [failedLoad]);

  useEffect(() => {
    if (!flashMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFlashMessage("");
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flashMessage]);

  //Resets form error state before opening and closing modal
  function resetFormStuff() {
    setFormErrors({});
    setShowFormErrors(false);
  }

  //Form valdiation and error handling making sure that the product name, category and price are alwys filled in
  function checkForm(data) {
    const errors = {};

    if (!data || !data.name || !data.name.trim()) {
      errors.name = "Name is required.";
    }

    if (!data || !data.category || !data.category.trim()) {
      errors.category = "Category is required.";
    }

    if (data?.price === "" || data?.price == null || Number.isNaN(Number(data.price))) {
      errors.price = "Price is required.";
    } else if (Number(data.price) < 0) {
      errors.price = "Price must be 0 or more.";
    }

    if (data?.stock === "" || data?.stock == null || Number.isNaN(Number(data.stock))) {
      errors.stock = "Stock is required.";
    } else if (!Number.isInteger(Number(data.stock)) || Number(data.stock) < 0) {
      errors.stock = "Stock must be a whole number of 0 or more.";
    }

    if (!PRODUCT_STATUSES.includes(data?.status)) {
      errors.status = "Choose a valid status.";
    }

    return errors;
  }

  //open the modal for editing or creating a new product
  function openProductModal(product) {
    setSelectedId(product.id);
    setDraft({
      ...product,
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    });
    resetFormStuff();
    setIsModalOpen(true);
  }

  //Closing the model 
  function closeModal() {
    setIsModalOpen(false);
    setSelectedId(null);
    setDraft(null);
    resetFormStuff();
  }

  //Saving a draft for when editting and creating new products, but user still has to click save to ensure the changes take effect
  function saveDraft(mode) {
    if (!draft) {
      return;
    }

    const errors = checkForm(draft);

    setShowFormErrors(true);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const cleanedDraft = {
      ...draft,
      name: draft.name.trim(),
      category: String(draft.category ?? "").trim(),
      price: Number(draft.price),
      stock: Number(draft.stock),
    };

    if (mode === "create") {
      setProducts([...products, cleanedDraft]);
    } else {
      const nextProducts = products.map((product) => {
        if (product.id === selectedId) {
          return {
            ...product,
            name: cleanedDraft.name,
            category: cleanedDraft.category,
            status: cleanedDraft.status,
            price: cleanedDraft.price || product.price,
            stock: cleanedDraft.stock || product.stock,
          };
        }

        return product;
      });

      setProducts(nextProducts);
    }

    closeModal();
  }

  //Deletes a product from the table
  function handleDelete() {
    if (!selectedId) {
      return;
    }

    const ok = confirm("Delete this product? (UI only)");

    if (!ok) {
      return;
    }

    const nextProducts = products.filter((product) => product.id !== selectedId);
    setProducts(nextProducts);
    closeModal();
  }

  //Selects one row at a time or unselects it if already selected
  function toggleRowSelection(id) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  //Bulk changes for a status change
  function handleBulkStatusChange() {
    if (selectedIds.length === 0) {
      return;
    }

    const selectedIdSet = new Set(selectedIds);
    const nextProducts = products.map((product) => {
      if (!selectedIdSet.has(product.id)) {
        return product;
      }

      return {
        ...product,
        status: bulkStatus,
      };
    });

    setProducts(nextProducts);
    setFlashMessage(
      `Updated ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} to ${bulkStatus}.`
    );
    setSelectedIds([]);
  }

  //Creating a new product with a unqie ID that follows the last ID used
  function handleCreate() {
    let maxNumber = 0;

    for (let i = 0; i < products.length; i += 1) {
      const match = String(products[i].id).trim().match(/^prd-(\d+)$/i);

      if (match) {
        const number = Number(match[1]);

        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const nextId = `prd-${String(nextNumber).padStart(3, "0")}`;
    let nextStatus = "active";

    if (statusFilter !== "all" && PRODUCT_STATUSES.includes(statusFilter)) {
      nextStatus = statusFilter;
    }

    setSelectedId(nextId);
    setDraft({
      id: nextId,
      name: searchTerm.trim(),
      category: "",
      price: "0",
      stock: "0",
      status: nextStatus,
    });
    resetFormStuff();
    setIsModalOpen(true);
  }

  //Updates draft values as the user types in the modal form
  function handleDraftChange(field, value) {
    if (!draft) {
      return;
    }

    const nextDraft = {
      ...draft,
      [field]: value,
    };

    setDraft(nextDraft);

    if (showFormErrors || formErrors[field]) {
      setFormErrors(checkForm(nextDraft));
    }
  }

  //checks for error if user tried to save without fields being filled in
  function handleFieldBlur(field) {
    if (!draft) {
      return;
    }

    const nextErrors = checkForm(draft);

    if (nextErrors[field] || showFormErrors) {
      setFormErrors(nextErrors);
    }
  }

  //Saves the form
  function handleFormSubmit(e) {
    e.preventDefault();

    if (isCreateMode) {
      saveDraft("create");
    } else {
      saveDraft("edit");
    }
  }

  //Resets filters 
  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setSortedPrice("none");
  }

  //Filtering products based on search words, status selection or pricing sorting
  let filteredProducts = [...products];
  const text = searchTerm.trim().toLowerCase();

  //Searching by name, cateogry or product id
  if (text) {
    filteredProducts = filteredProducts.filter((product) => {
      const name = product.name ? product.name.toLowerCase() : "";
      const category = String(product.category ?? "").toLowerCase();
      const id = String(product.id).toLowerCase();

      return name.includes(text) || id.includes(text) || category.includes(text);
    });
  }

  //Filtering by status
  if (statusFilter !== "all") {
    filteredProducts = filteredProducts.filter((product) => {
      return String(product.status).toLowerCase() === statusFilter.toLowerCase();
    });
  }

  //Sorting the products by the price 
  if (sortedPrice === "asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => Number(a.price) - Number(b.price));
  }

  if (sortedPrice === "desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => Number(b.price) - Number(a.price));
  }

  const visibleIds = filteredProducts.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.includes(id));
  const isCreateMode =
    isModalOpen && draft && !products.some((product) => product.id === selectedId);

  useEffect(() => {
    const nextSelectedIds = selectedIds.filter((id) => visibleIds.includes(id));

    if (nextSelectedIds.length !== selectedIds.length) {
      setSelectedIds(nextSelectedIds);
    }
  }, [selectedIds, visibleIds]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  //Selects or unselects all visible rows in the table
  function toggleSelectAllVisible() {
    const isEverythingSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (isEverythingSelected) {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)));
      return;
    }

    const nextSelectedIds = [...selectedIds];

    visibleIds.forEach((id) => {
      if (!nextSelectedIds.includes(id)) {
        nextSelectedIds.push(id);
      }
    });

    setSelectedIds(nextSelectedIds);
  }

  if (isLoading) {
    return (
      <div className="app-shell">
        <h2>Products</h2>
        <p>Loading products...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="app-shell">
        <h2>Products</h2>
        <p className="message-banner message-banner-error">
          Error loading products: {errorMsg}
        </p>

        <div className="button-row">
          <button onClick={() => setFailedLoad(false)}>Turn off mock failure</button>
          <button onClick={() => setFailedLoad(!failedLoad)}>
            Toggle mock failure (currently {failedLoad ? "ON" : "OFF"})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-header">
        <div className="page-eyebrow">Inventory Desk</div>
        <h2>Products</h2>
        <p>Manage product records, update stock status, and edit product details.</p>
      </div>

      <div className="toolbar">
        <div className="field-group toolbar-field">
          <label htmlFor="search">Search:</label>
          <input
            id="search"
            type="text"
            placeholder="Search by name, category, or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="field-group toolbar-field">
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group toolbar-field">
          <label htmlFor="sortPrice">Sort by Price:</label>
          <select
            id="sortPrice"
            value={sortedPrice}
            onChange={(e) => setSortedPrice(e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button className="button-secondary" onClick={clearFilters}>
          Clear Filters
        </button>

        <button className="button-primary" onClick={handleCreate}>
          + Add Product
        </button>
      </div>

      {flashMessage && <div className="message-banner message-banner-success">{flashMessage}</div>}

      <div className="bulk-actions">
        <div>
          <strong>{selectedIds.length} selected</strong>
          <p className="bulk-actions-help">
            Select products, then choose a status and apply it to the selected rows.
          </p>
        </div>

        <div className="bulk-actions-controls">
          <label htmlFor="bulkStatus">Change status to:</label>
          <select
            id="bulkStatus"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            disabled={selectedIds.length === 0}
          >
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <button
            className="button-primary"
            onClick={handleBulkStatusChange}
            disabled={selectedIds.length === 0}
          >
            Apply
          </button>

          <button
            className="button-secondary"
            onClick={() => setSelectedIds([])}
            disabled={selectedIds.length === 0}
          >
            Clear Selection
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>No products found.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                  />
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);

                return (
                  <tr key={product.id} className={isSelected ? "is-selected" : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(product.id)}
                      />
                    </td>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>R{product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`status-text status-${product.status}`}>{product.status}</span>
                    </td>
                    <td>
                      <button className="button-secondary" onClick={() => openProductModal(product)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && draft && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {isCreateMode ? "Create Product" : "Edit Product"} - {draft.name || "(Unnamed)"}
              </h3>
              <button className="button-secondary" onClick={closeModal}>
                Close
              </button>
            </div>

            {showFormErrors && Object.keys(formErrors).length > 0 && (
              <div className="message-banner message-banner-error">
                Fix the highlighted fields before saving.
              </div>
            )}

            <form className="product-form" onSubmit={handleFormSubmit}>
              <div className="field-group">
                <label htmlFor="productName">Name</label>
                <input
                  id="productName"
                  value={draft.name}
                  onBlur={() => handleFieldBlur("name")}
                  onChange={(e) => handleDraftChange("name", e.target.value)}
                />
                {formErrors.name && <p className="field-error">{formErrors.name}</p>}
              </div>

              <div className="field-group">
                <label htmlFor="productCategory">Category</label>
                <input
                  id="productCategory"
                  value={draft.category}
                  onBlur={() => handleFieldBlur("category")}
                  onChange={(e) => handleDraftChange("category", e.target.value)}
                />
                {formErrors.category && <p className="field-error">{formErrors.category}</p>}
              </div>

              <div className="field-group">
                <label htmlFor="productStatus">Status</label>
                <select
                  id="productStatus"
                  value={draft.status}
                  onBlur={() => handleFieldBlur("status")}
                  onChange={(e) => handleDraftChange("status", e.target.value)}
                >
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                {formErrors.status && <p className="field-error">{formErrors.status}</p>}
              </div>

              <div className="field-group">
                <label htmlFor="productPrice">Price</label>
                <input
                  id="productPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={draft.price}
                  onBlur={() => handleFieldBlur("price")}
                  onChange={(e) => handleDraftChange("price", e.target.value)}
                />
                {formErrors.price && <p className="field-error">{formErrors.price}</p>}
              </div>

              <div className="field-group">
                <label htmlFor="productStock">Stock</label>
                <input
                  id="productStock"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={draft.stock}
                  onBlur={() => handleFieldBlur("stock")}
                  onChange={(e) => handleDraftChange("stock", e.target.value)}
                />
                {formErrors.stock && <p className="field-error">{formErrors.stock}</p>}
              </div>

              <div className="field-group field-full">
                <label htmlFor="productId">ID</label>
                <input id="productId" value={draft.id} readOnly />
              </div>

              <div className="form-actions">
                {!isCreateMode && (
                  <button className="button-danger" type="button" onClick={handleDelete}>
                    Delete
                  </button>
                )}

                <button className="button-secondary" type="button" onClick={closeModal}>
                  Cancel
                </button>

                <button className="button-primary" type="submit">
                  {isCreateMode ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
