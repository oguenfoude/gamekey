"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";
import { FaEye, FaCheck, FaTimes } from "react-icons/fa";

interface PreOrder {
  _id: string;
  userId: string;
  productId: string;
  date: string;
  status: string;
  message: string;
  fulfillmentDate?: string;
  userName: string;
  userTelegramId: string;
  productName: string;
  productPrice: number;
  fullName?: string;
  clientMessage?: string;
  fulfillmentDetails?: string;
  clientMessageData?: string;
}

interface User {
  _id: string;
  fullName?: string;
  username: string;
}

export default function PreOrdersPage() {
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [filteredPreOrders, setFilteredPreOrders] = useState<PreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(
    null
  );
  const [action, setAction] = useState<"fulfilled" | "canceled" | null>(null);
  const [emailPassword, setEmailPassword] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPreOrderDetailsModal, setShowPreOrderDetailsModal] = useState(false);
  const [usersMap, setUsersMap] = useState<{ [userId: string]: User | null }>({});
  const itemsPerPage = 10; // Limit to 10 entries per page

  useEffect(() => {
    fetchPreOrders();
  }, []);

  useEffect(() => {
    // Filter and sort pre-orders
    let filtered = preOrders;

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (preOrder) => preOrder.status === selectedStatus
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (preOrder) =>
          preOrder.productName.toLowerCase().includes(searchLower) ||
          (preOrder.fullName || preOrder.userName)
            .toLowerCase()
            .includes(searchLower)
      );
    }

    // Sort by date (newest to oldest)
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setFilteredPreOrders(filtered);
    setCurrentPage(1); // Reset to the first page when filters change
  }, [selectedStatus, searchTerm, preOrders]);

  const fetchPreOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get("/preorders");
      setPreOrders(response);

      const userIds = Array.from(new Set(response.map((p: PreOrder) => p.userId)));
      const usersData = await Promise.all(
        userIds.map(async (id) => {
          try {
            return { id, data: await apiClient.get(`/users/${id}`) };
          } catch {
            return { id, data: null };
          }
        })
      ) as Array<{ id: string; data: User | null }>;
      const map: { [key: string]: User | null } = {};
      usersData.forEach(u => {
        map[u.id] = u.data;
      });
      setUsersMap(map);
    } catch (error: any) {
      setError("Error fetching pre-orders. Please try again later.");
      console.error("Error fetching pre-orders:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreOrderStatus = async (
    preOrderId: string,
    status: string,
    emailPassword?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.put(`/preorders/${preOrderId}/status`, {
        status,
        emailPassword,
      });
      await fetchPreOrders();
      setIsLoading(false);
    } catch (error: any) {
      setError(`Error updating pre-order status to ${status}.`);
      console.error(
        `Error updating pre-order status to ${status}:`,
        error.message
      );
      setIsLoading(false);
    }
  };

  const handleFulfill = (preOrder: PreOrder) => {
    setSelectedPreOrder(preOrder);
    setAction("fulfilled");
  };

  const handleCancel = (preOrder: PreOrder) => {
    setSelectedPreOrder(preOrder);
    setAction("canceled");
  };

  const handleViewDetails = (preOrder: PreOrder) => {
    setSelectedPreOrder(preOrder);
    setShowPreOrderDetailsModal(true);
  };

  const handleActionConfirm = async () => {
    if (selectedPreOrder && action) {
      if (action === "fulfilled" && !emailPassword) {
        setError("Email and password are required for fulfillment.");
        return;
      }
      await updatePreOrderStatus(
        selectedPreOrder._id,
        action,
        action === "fulfilled" ? emailPassword : undefined
      );
      setSelectedPreOrder(null);
      setAction(null);
      setEmailPassword("");
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "fulfilled":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPreOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredPreOrders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Pre-Orders Management
          </h1>
          <button
            onClick={fetchPreOrders}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Refresh Orders
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-6 border-b flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by product or user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus("pending")}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === "pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus("fulfilled")}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === "fulfilled"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Fulfilled
            </button>
            <button
              onClick={() => setSelectedStatus("canceled")}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === "canceled"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Canceled
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-red-500">{error}</div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pre-orders found.
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {paginatedOrders.map((preOrder) => (
              <div
                key={preOrder._id}
                className="bg-white rounded-md shadow p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div 
                    onClick={() => toggleOrderExpand(preOrder._id)}
                    className="cursor-pointer grow space-y-1"
                  >
                    <p className="text-sm font-semibold">
                      {preOrder.productName} - ${preOrder.productPrice}
                    </p>
                    <p className="text-xs text-gray-600">
                      {usersMap[preOrder.userId]?.fullName ||
                        usersMap[preOrder.userId]?.username ||
                        preOrder.userName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(preOrder.date).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                        preOrder.status
                      )}`}
                    >
                      {preOrder.status}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(preOrder)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
                        title="View Details"
                      >
                        <FaEye size={14} />
                      </button>
                      
                      {preOrder.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleFulfill(preOrder)}
                            className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
                            title="Fulfill Order"
                          >
                            <FaCheck size={14} />
                          </button>
                          <button
                            onClick={() => handleCancel(preOrder)}
                            className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
                            title="Cancel Order"
                          >
                            <FaTimes size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {expandedOrders.has(preOrder._id) && (
                  <div className="mt-4 bg-gray-50 p-3 rounded">
                    <p className="text-sm">
                      <strong>Message:</strong> {preOrder.message || "N/A"}
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      {preOrder.clientMessage && (
                        <p>
                          <strong>Client Message:</strong>{" "}
                          {preOrder.clientMessage}
                        </p>
                      )}
                      {preOrder.clientMessageData && (
                        <p>
                          <strong>Client Message Data:</strong>{" "}
                          {preOrder.clientMessageData}
                        </p>
                      )}
                      {preOrder.fulfillmentDate && (
                        <p>
                          <strong>Fulfillment Date:</strong>{" "}
                          {new Date(
                            preOrder.fulfillmentDate
                          ).toLocaleString()}
                        </p>
                      )}
                      {preOrder.fulfillmentDetails && (
                        <p>
                          <strong>Fulfillment Details:</strong>{" "}
                          {preOrder.fulfillmentDetails}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

  {/* Action Confirmation Modal */}
  {selectedPreOrder && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {action === "fulfilled"
                  ? "Confirm Fulfillment"
                  : "Confirm Cancellation"}
              </h2>
              <p className="mb-4">
                Are you sure you want to{" "}
                <span className="font-bold">
                  {action === "fulfilled" ? "fulfill" : "cancel"}
                </span>{" "}
                this pre-order for{" "}
                <span className="font-bold">
                  {selectedPreOrder.productName}
                </span>
                ?
              </p>
              
              {action === "fulfilled" && (
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">
                    Email and Password (required for fulfillment)
                  </label>
                  <textarea
                    placeholder="Enter email and password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full border rounded p-2"
                    rows={3}
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedPreOrder(null);
                    setAction(null);
                    setEmailPassword("");
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionConfirm}
                  className={`px-4 py-2 text-white rounded-lg transition ${
                    action === "fulfilled" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  Confirm {action === "fulfilled" ? "Fulfillment" : "Cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Order Details Modal */}
      {showPreOrderDetailsModal && selectedPreOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Pre-Order Details</h2>
              <button
                onClick={() => setShowPreOrderDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">{selectedPreOrder.productName}</p>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPreOrder.status)}`}>
                  {selectedPreOrder.status}
                </span>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm">
                  <strong>Price:</strong> ${selectedPreOrder.productPrice}
                </p>
                <p className="text-sm">
                  <strong>Order Date:</strong> {new Date(selectedPreOrder.date).toLocaleString()}
                </p>
                {selectedPreOrder.fulfillmentDate && (
                  <p className="text-sm">
                    <strong>Fulfillment Date:</strong> {new Date(selectedPreOrder.fulfillmentDate).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm">
                  <strong>Customer:</strong> {selectedPreOrder.fullName || selectedPreOrder.userName}
                </p>
                {selectedPreOrder.userTelegramId && (
                  <p className="text-sm">
                    <strong>Telegram ID:</strong> {selectedPreOrder.userTelegramId}
                  </p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm">
                  <strong>Message:</strong> {selectedPreOrder.message || "N/A"}
                </p>
                {selectedPreOrder.clientMessage && (
                  <p className="text-sm">
                    <strong>Client Message:</strong> {selectedPreOrder.clientMessage}
                  </p>
                )}
                {selectedPreOrder.clientMessageData && (
                  <p className="text-sm">
                    <strong>Client Message Data:</strong> {selectedPreOrder.clientMessageData}
                  </p>
                )}
                {selectedPreOrder.fulfillmentDetails && (
                  <p className="text-sm">
                    <strong>Fulfillment Details:</strong> {selectedPreOrder.fulfillmentDetails}
                  </p>
                )}
              </div>
              
              {selectedPreOrder.status === "pending" && (
                <div className="border-t pt-4 flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setShowPreOrderDetailsModal(false);
                      handleFulfill(selectedPreOrder);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                  >
                    <FaCheck size={14} /> Fulfill Order
                  </button>
                  <button
                    onClick={() => {
                      setShowPreOrderDetailsModal(false);
                      handleCancel(selectedPreOrder);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                  >
                    <FaTimes size={14} /> Cancel Order
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowPreOrderDetailsModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}