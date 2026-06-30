"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";
import {
  FaEdit,
  FaTrash,
  FaPlusCircle,
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaCheck,
  FaHistory,
} from "react-icons/fa";
interface EmailChanges {
  old?: string[]; // Old list of emails
  new?: string[]; // New list of emails
  added?: string[]; // Emails that were added
  removed?: string[]; // Emails that were removed
}
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  emails: string[];
  categoryId: string;
  isAvailable: boolean;
  allowPreOrder: boolean;
  createdDate: Date;
  archive: Array<any>;
  salesHistory?: ProductSaleEvent[];
  history?: ProductHistoryEntry[];
}

interface ProductSaleEvent {
  userId: string;
  fullName: string;
  date: Date;
  price: number;
  emailPassword: string;
}

interface Category {
  _id: string;
  name: string;
}

interface ProductHistoryEntry {
  action: "create" | "update" | "delete" | "sale";
  date: Date;
  details: string;
  updatedFields?: Record<string, any>;
  userDetails?: { fullName: string; phone: string };
  productDetails?: { productName: string; categoryName: string };
}
interface User {
  _id?: string;
  telegramId: string;
  chatId: string;
  username: string;
  name: string;
  fullName?: string;
  phoneNumber?: string;
  balance: number;
  registerDate: Date;
  isAccepted: boolean;
  history?: UserEvent[];
}

interface UserEvent {
  type: "recharge" | "status" | "delete" | "purchase";
  date: Date;
  amount?: number;
  status?: string;
  productId?: string;
  productName?: string;
  price?: number;
  emailSold?: string;
  categoryName?: string;
  adminAction?: "Recharge" | "Discount";
}

interface ArchiveEntry {
  emailPassword: string;
  soldTo: string;
  soldAt: Date;
  price: number;
}
interface AlertProps {
  type: "success" | "error" | "warning";
  message: string;
  onClose: () => void;
}
const HistoryModal = ({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) => {
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesData, setSalesData] = useState<
    Array<{
      sale: ArchiveEntry;
      user?: User;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleEntries, setVisibleEntries] = useState(10); // Show only 10 entries initially

  // Fetch sales data (only once when the modal opens)
  useEffect(() => {
    fetchSalesData();
  }, []);

  // Fetch sales data and map it to users
  const fetchSalesData = async () => {
    if (!product.archive?.length) return;

    setIsLoading(true);
    try {
      const salesWithUsers = await Promise.all(
        product.archive.slice(-10).map(async (sale: ArchiveEntry) => {
          try {
            const user = await apiClient.get(`/users/${sale.soldTo}`);
            return { sale, user };
          } catch {
            return { sale, user: undefined };
          }
        })
      );
      setSalesData(salesWithUsers);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine history and sales entries
  const getAllHistoryEntries = () => {
    const historyEntries = [...(product.history || [])];

    const salesEntries = salesData.map(({ sale, user }) => ({
      action: "sale",
      date: new Date(sale.soldAt),
      details: `Product sold to ${user?.fullName || "Unknown User"}`,
      updatedFields: {
        price: sale.price,
        emailPassword: sale.emailPassword,
      },
      userDetails: user
        ? {
            fullName: user.fullName || "N/A",
            phone: user.phoneNumber || "N/A",
          }
        : undefined,
      productDetails: {
        productName: product.name,
        categoryName: "N/A",
      },
    }));

    return [...historyEntries, ...salesEntries]
      .filter((entry) => {
        const passesActionFilter =
          selectedAction === "all" || entry.action === selectedAction;
        const entryDate = new Date(entry.date);
        const passesStartDate = !startDate || entryDate >= new Date(startDate);
        const passesEndDate = !endDate || entryDate <= new Date(endDate);
        return passesActionFilter && passesStartDate && passesEndDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  };

  // Format changes for display
  const formatChanges = (entry: any) => {
    if (entry.action === "sale") {
      return (
        <div className="space-y-1">
          <div className="font-medium text-purple-600">Sale Details:</div>
          <div>Price: ${entry.updatedFields.price}</div>
          <div>Email: {entry.updatedFields.emailPassword}</div>
        </div>
      );
    }

    if (!entry.updatedFields) return null;

    return (
      <div className="space-y-2">
        {Object.entries(entry.updatedFields).map(([field, value]) => {
          if (field === "emails") {
            return (
              <div key={field}>
                <span className="font-medium">Email Updates:</span>
                {handleEmailChanges(value as EmailChanges)}
              </div>
            );
          }
          return (
            <div key={field}>
              <span className="font-medium">{field}:</span> {String(value)}
            </div>
          );
        })}
      </div>
    );
  };

  // Handle email changes
  const handleEmailChanges = (value: EmailChanges = {}) => {
    const { old = [], new: newEmails = [], added = [], removed = [] } = value;

    return (
      <div className="space-y-2">
        {removed.length > 0 && (
          <div className="text-red-600">Removed: {removed.join(", ")}</div>
        )}
        {added.length > 0 && (
          <div className="text-green-600">Added: {added.join(", ")}</div>
        )}
        {old.length > 0 && newEmails.length > 0 && (
          <div>
            Changed from: {old.join(", ")} to {newEmails.join(", ")}
          </div>
        )}
      </div>
    );
  };

  // Get filtered and sorted history entries
  const historyEntries = getAllHistoryEntries();

  return (
    <Modal title={`History - ${product.name}`} onClose={onClose}>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">
              Action Type
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="sale">Sale</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <select
              className="w-full p-2 border rounded"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* History Entries (Card-Based Design) */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-8 text-center">Loading history...</div>
          ) : historyEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No history entries found.
            </div>
          ) : (
            <>
              {historyEntries.slice(0, visibleEntries).map((entry, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleString()}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.action === "sale"
                              ? "bg-purple-100 text-purple-800"
                              : entry.action === "create"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {entry.action.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {entry.userDetails && (
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {entry.userDetails.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.userDetails.phone}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    {formatChanges(entry)}
                  </div>
                </div>
              ))}
              {historyEntries.length > visibleEntries && (
                <button
                  onClick={() => setVisibleEntries((prev) => prev + 10)}
                  className="w-full py-2 text-center text-blue-500 hover:bg-blue-50 rounded-lg"
                >
                  Load More
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

const Alert = ({ type, message, onClose }: AlertProps) => {
  const bgColor = {
    success: "bg-green-100 border-green-500 text-green-700",
    error: "bg-red-100 border-red-500 text-red-700",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-700",
  }[type];

  const Icon = {
    success: FaCheck,
    error: FaExclamationTriangle,
    warning: FaExclamationTriangle,
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor} z-50 flex items-center shadow-lg`}
    >
      <Icon className="mr-2" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <FaTimes />
      </button>
    </div>
  );
};

const Modal = ({
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  isDanger = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  isDanger?: boolean;
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>
      </div>
      {children}
      <div className="flex justify-end mt-4 space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        {onConfirm && (
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded transition ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {confirmText}
          </button>
        )}
      </div>
    </div>
  </div>
);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteEmailModal, setShowDeleteEmailModal] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [emailsToAdd, setEmailsToAdd] = useState<string[]>([]);
  const [emailStats, setEmailStats] = useState({
    valid: 0,
    invalid: 0,
    duplicate: 0,
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const validateEmails = (emailString: string) => {
    const emailList = emailString
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    const stats = {
      valid: 0,
      invalid: 0,
      duplicate: 0,
    };

    const validEmails = emailList.filter((email) => {
      const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isDuplicate = selectedProduct?.emails.includes(email);

      if (!isValidFormat) {
        stats.invalid++;
      } else if (isDuplicate) {
        stats.duplicate++;
      } else {
        stats.valid++;
      }

      return isValidFormat && !isDuplicate;
    });

    setEmailStats(stats);
    return validEmails;
  };

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [newProductData, setNewProductData] = useState({
    name: "",
    description: "",
    price: "",
    emailsText: "",
    categoryId: "",
    isAvailable: false,
    allowPreOrder: false,
  });

  const showAlert = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/categories");
      setCategories(response || []);
    } catch (error) {
      showAlert("error", "Failed to fetch categories");
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const handleDeleteEmail = async (email: string) => {
    if (!selectedProduct) {
      showAlert("error", "No product selected");
      return;
    }

    if (!email || !selectedProduct.emails.includes(email)) {
      showAlert("error", "Invalid email or email not found");
      return;
    }

    try {
      setIsLoading(true);

      // Verify the product still exists
      const productCheck = await apiClient.get(
        `/products/${selectedProduct._id}`
      );
      if (!productCheck) {
        throw new Error("Product not found");
      }

      // Create the updated product data
      const updatedEmails = selectedProduct.emails.filter((e) => e !== email);

      // Check if the emails array is empty
      if (updatedEmails.length === 0) {
        showAlert(
          "warning",
          "Cannot delete the last email. Please add another email first."
        );
        return;
      }

      const updatedProduct = {
        ...selectedProduct,
        emails: updatedEmails,
      };

      const response = await apiClient.put(
        `/products/${selectedProduct._id}`,
        updatedProduct
      );

      if (!response) {
        throw new Error("No response from server");
      }

      // Update local state only after successful API call
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === selectedProduct._id ? { ...p, emails: updatedEmails } : p
        )
      );

      setSelectedProduct((prev) =>
        prev ? { ...prev, emails: updatedEmails } : null
      );

      showAlert("success", "Email deleted successfully");
      setShowDeleteEmailModal(false);
      setEmailToDelete("");
    } catch (error: any) {
      console.error("Error in handleDeleteEmail:", error);
      if (error.message === "Product not found") {
        showAlert("error", "Product no longer exists. Refreshing list...");
        setSelectedProduct(null);
        setShowDeleteEmailModal(false);
        await fetchProducts();
      } else {
        showAlert("error", "An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/products");

      if (!response) {
        throw new Error("Failed to fetch products");
      }

      setProducts(response || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setProducts([]);
      if (!(error.message && (error.message.includes("No products found") || error.message.includes("404")))) {
        showAlert("error", "Failed to fetch products. Please refresh the page.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const emailLines = newEmail.split("\n").map((line) => line.trim()).filter((line) => line);

    if (emailLines.length > 0) {
      setEmailsToAdd(emailLines);
      setShowEmailConfirmModal(true);
    } else {
      showAlert("warning", "No valid new emails to add");
    }
  };

  const MAX_EMAILS_PER_REQUEST = 100; // Send 100 emails per request

  const confirmAddEmails = async () => {
    if (!selectedProduct || emailsToAdd.length === 0) return;

    try {
      for (let i = 0; i < emailsToAdd.length; i += MAX_EMAILS_PER_REQUEST) {
        const chunk = emailsToAdd.slice(i, i + MAX_EMAILS_PER_REQUEST);
        await apiClient.put(`/products/${selectedProduct._id}`, {
          emails: chunk,
        });
      }

      // Update local state
      setSelectedProduct((prev) =>
        prev ? { ...prev, emails: [...prev.emails, ...emailsToAdd] } : null
      );

      setNewEmail("");
      setEmailsToAdd([]);
      setShowEmailConfirmModal(false);
      showAlert("success", `Successfully added ${emailsToAdd.length} email(s)`);
    } catch (error) {
      console.error("Error adding emails:", error);
      showAlert("error", "Failed to add emails");
    }
  };
  const EmailConfirmationModal = () => (
    <Modal
      title="Confirm Add Emails"
      onClose={() => setShowEmailConfirmModal(false)}
      onConfirm={confirmAddEmails}
      confirmText="Add Emails"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg mb-2">Email Analysis:</h3>
          <div className="space-y-2">
            <p className="text-green-600">
              Valid new emails: {emailStats.valid}
            </p>
            {emailStats.invalid > 0 && (
              <p className="text-red-600">
                Invalid emails: {emailStats.invalid}
              </p>
            )}
            {emailStats.duplicate > 0 && (
              <p className="text-yellow-600">
                Duplicate emails: {emailStats.duplicate}
              </p>
            )}
          </div>
        </div>

        {emailsToAdd.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Emails to be added:</h3>
            <div className="max-h-40 overflow-y-auto bg-white border rounded-lg p-2">
              {emailsToAdd.map((email, index) => (
                <div key={index} className="py-1 px-2 hover:bg-gray-50">
                  {email}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
  const handleCreateProduct = async () => {
    try {
      const {
        name,
        price,
        emailsText,
        categoryId,
        isAvailable,
        allowPreOrder,
      } = newProductData;

      if (!name || !price || !categoryId) {
        showAlert("error", "Name, Price, and Category are required");
        return;
      }

      const emailsArray = emailsText
        .split(",")
        .map((email) => email.trim())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      if (emailsArray.length === 0) {
        showAlert("error", "At least one valid email is required");
        return;
      }

      const productData = {
        name,
        description: "",
        price: parseFloat(price),
        emails: emailsArray,
        categoryId,
        isAvailable,
        allowPreOrder,
      };

      await apiClient.post("/products", productData);
      resetFormData();
      setShowCreateModal(false);
      fetchProducts();
      showAlert("success", "Product created successfully");
    } catch (error) {
      console.error("Error creating product:", error);
      showAlert("error", "Failed to create product");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) {
      showAlert("error", "No product selected");
      return;
    }

    try {
      const { name, price, categoryId, isAvailable, allowPreOrder } =
        newProductData;

      if (!name || !price || !categoryId) {
        showAlert("error", "Name, Price, and Category are required");
        return;
      }

      const updatedProductData = {
        ...selectedProduct,
        name,
        price: parseFloat(price),
        categoryId,
        isAvailable,
        allowPreOrder,
      };

      const response = await apiClient.put(
        `/products/${selectedProduct._id}`,
        updatedProductData
      );

      if (!response) {
        throw new Error("Failed to update product");
      }

      resetFormData();
      setShowEditModal(false);
      fetchProducts();

      // Show confirmation message after successful edit
      showAlert("success", "Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      showAlert("error", "Failed to update product");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) {
      showAlert("error", "No product selected");
      return;
    }

    try {
      await apiClient.delete(`/products/${selectedProduct._id}`);
      setSelectedProduct(null);
      setShowDeleteModal(false);
      fetchProducts();
      showAlert("success", "Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      showAlert("error", "Failed to delete product");
    }
  };

  const resetFormData = () => {
    setNewProductData({
      name: "",
      description: "",
      price: "",
      emailsText: "",
      categoryId: "",
      isAvailable: false,
      allowPreOrder: false,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <h1 className="text-3xl font-bold mb-6 text-center">
        Product Management
      </h1>

      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-black text-white px-6 py-2 rounded mb-4 hover:bg-gray-800 transition flex items-center border border-black"
      >
        <FaPlusCircle className="mr-2" /> Add New Product
      </button>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <FaSpinner className="animate-spin text-gray-500" size={36} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No products found. Click "Add New Product" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-300">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">Pre-Order</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-100 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-black">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {categories.find((cat) => cat._id === product.categoryId)?.name || "Uncategorized"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-black">${product.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded bg-gray-200 text-black border border-gray-400">
                        {product.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded bg-gray-200 text-black border border-gray-400">
                        {product.allowPreOrder ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowHistoryModal(true);
                          }}
                          className="text-black hover:text-gray-600 bg-gray-200 p-2 rounded transition-colors border border-gray-300 hover:bg-gray-300"
                          title="View History"
                        >
                          <FaHistory size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setNewProductData({
                              name: product.name,
                              description: product.description,
                              price: product.price.toString(),
                              emailsText: product.emails.join(", "),
                              categoryId: product.categoryId,
                              isAvailable: product.isAvailable,
                              allowPreOrder: product.allowPreOrder,
                            });
                            setShowEditModal(true);
                          }}
                          className="text-black hover:text-gray-600 bg-gray-200 p-2 rounded transition-colors border border-gray-300 hover:bg-gray-300"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                          }}
                          className="text-black hover:text-gray-600 bg-gray-200 p-2 rounded transition-colors border border-gray-300 hover:bg-gray-300"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal
          title="Create New Product"
          onClose={() => setShowCreateModal(false)}
          onConfirm={handleCreateProduct}
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Product Name *</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={newProductData.name}
                onChange={(e) =>
                  setNewProductData({ ...newProductData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={newProductData.price}
                onChange={(e) =>
                  setNewProductData({
                    ...newProductData,
                    price: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Category *</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={newProductData.categoryId}
                onChange={(e) =>
                  setNewProductData({
                    ...newProductData,
                    categoryId: e.target.value,
                  })
                }
                required
              >
                <option value="">Select a Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Emails *</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter emails, one per line (e.g., email@domain.com:password)"
                value={newProductData.emailsText}
                onChange={(e) =>
                  setNewProductData({
                    ...newProductData,
                    emailsText: e.target.value,
                  })
                }
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                At least one valid email is required
              </p>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={newProductData.isAvailable}
                  onChange={(e) =>
                    setNewProductData({
                      ...newProductData,
                      isAvailable: e.target.checked,
                    })
                  }
                />
                Available
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={newProductData.allowPreOrder}
                  onChange={(e) =>
                    setNewProductData({
                      ...newProductData,
                      allowPreOrder: e.target.checked,
                    })
                  }
                />
                Allow Pre-Order
              </label>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && selectedProduct && (
        <Modal
          title="Edit Product"
          onClose={() => {
            setShowEditModal(false);
            setIsEditMode(false);
          }}
          onConfirm={handleSaveEdit}
          confirmText="Save Changes"
        >
          <div className="space-y-6">
            {/* Product Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newProductData.name}
                    onChange={(e) =>
                      setNewProductData({
                        ...newProductData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newProductData.price}
                    onChange={(e) =>
                      setNewProductData({
                        ...newProductData,
                        price: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newProductData.categoryId}
                    onChange={(e) =>
                      setNewProductData({
                        ...newProductData,
                        categoryId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Available
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-500"
                      checked={newProductData.isAvailable}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          isAvailable: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm text-gray-700">
                      {newProductData.isAvailable ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Pre-Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Pre-Order
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-500"
                      checked={newProductData.allowPreOrder}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          allowPreOrder: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm text-gray-700">
                      {newProductData.allowPreOrder ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emails Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Emails</h3>
              <div className="space-y-4">
                {/* Current Emails */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Current Emails ({selectedProduct.emails.length})
                  </label>
                  <div className="bg-white p-2 rounded-lg shadow-inner max-h-40 overflow-y-auto">
                    {selectedProduct.emails.map((email, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-800">{email}</span>
                        <button
                          onClick={() => {
                            setEmailToDelete(email);
                            setShowDeleteEmailModal(true);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Emails */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Add New Emails
                  </label>
                  <form onSubmit={handleAddEmail} className="flex gap-2">
                    <textarea
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter emails, one per line (e.g., email@domain.com:password)"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteEmailModal && (
        <Modal
          title="Delete Email"
          onClose={() => {
            setShowDeleteEmailModal(false);
            setEmailToDelete("");
          }}
          onConfirm={() => {
            handleDeleteEmail(emailToDelete);
          }}
          confirmText="Delete"
          isDanger
        >
          <div className="space-y-4">
            <p>Are you sure you want to delete the email "{emailToDelete}"?</p>
            {isLoading && (
              <div className="flex items-center justify-center text-gray-600">
                <FaSpinner className="animate-spin mr-2" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showDeleteModal && selectedProduct && (
        <Modal
          title="Delete Product"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          isDanger
        >
          <p className="text-gray-700">
            Are you sure you want to delete the product "{selectedProduct.name}
            "? This action cannot be undone.
          </p>
        </Modal>
      )}
      {showEmailConfirmModal && <EmailConfirmationModal />}

      {showHistoryModal && selectedProduct && (
        <HistoryModal
          product={selectedProduct}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}
