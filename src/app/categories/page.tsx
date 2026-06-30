"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

interface Category {
  _id: string;
  name: string;
}

interface HistoryEntry {
  _id: string;
  entity: string;
  entityId: string;
  action: string;
  timestamp: string;
  performedBy: {
    type: string;
    id: string | null;
  };
  details: string;
  metadata?: Record<string, any>;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoryHistory, setCategoryHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from the server
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/categories");
      setCategories(response || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      setIsLoading(false);
    }
  };

  // Fetch category history from the server
  const fetchCategoryHistory = async (categoryId: string) => {
    try {
      const response = await apiClient.get(`/history/category/${categoryId}`);
      setCategoryHistory(response || []);
    } catch (error) {
      console.error("Error fetching category history:", error);
      setCategoryHistory([]);
    }
  };

  // Add Category
  const handleCreateCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        alert("Category name cannot be empty.");
        return;
      }
      await apiClient.post("/categories", { name: newCategoryName });
      setNewCategoryName("");
      setShowCreateModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  // Edit Category
  const handleEditCategory = async () => {
    try {
      if (!selectedCategory || !newCategoryName.trim()) {
        alert("Category name cannot be empty.");
        return;
      }
      await apiClient.put(`/categories/${selectedCategory._id}`, {
        name: newCategoryName,
      });
      setSelectedCategory(null);
      setNewCategoryName("");
      setShowEditModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    try {
      if (!selectedCategory) return;
      await apiClient.delete(`/categories/${selectedCategory._id}`);
      setSelectedCategory(null);
      setShowDeleteModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4 hover:bg-green-600 transition"
      >
        Add Category
      </button>

      {isLoading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4 border-b">Name</th>
                <th className="text-left p-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 border-b">{category.name}</td>
                  <td className="p-4 border-b flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setNewCategoryName(category.name);
                        setShowEditModal(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowDeleteModal(true);
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={async () => {
                        setSelectedCategory(category);
                        await fetchCategoryHistory(category._id);
                        setShowHistoryModal(true);
                      }}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          title="Add New Category"
          onCancel={() => {
            setShowCreateModal(false);
            setNewCategoryName("");
          }}
          onConfirm={handleCreateCategory}
          confirmText="Add"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category Name"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCategory && (
        <Modal
          title="Edit Category"
          onCancel={() => {
            setShowEditModal(false);
            setNewCategoryName("");
          }}
          onConfirm={handleEditCategory}
          confirmText="Update"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category Name"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <Modal
          title={`Delete Category`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteCategory}
          confirmText="Delete"
        >
          <p>
            Are you sure you want to delete the category "
            <strong>{selectedCategory.name}</strong>"?
          </p>
        </Modal>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCategory && (
        <Modal
          title={`History for ${selectedCategory.name}`}
          onCancel={() => setShowHistoryModal(false)}
        >
          {categoryHistory.length > 0 ? (
            <ul className="space-y-2">
              {categoryHistory.map((entry) => (
                <li key={entry._id} className="border-b pb-2">
                  <p className="text-sm text-gray-600">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  <p>{entry.details}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No history available.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
}: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="mb-4">{children}</div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
