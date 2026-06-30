"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";
import {
  FaUserCheck,
  FaUserTimes,
  FaSpinner,
  FaSearch,
  FaHistory,
  FaPlusCircle,
  FaTrash,
  FaSort,
  FaEdit,
} from "react-icons/fa";
import UserDetailsDialog from "@/components/UserDetailsDialog";

// Define types
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

export interface User {
  _id: string;
  telegramId?: string;
  chatId?: string;
  username: string;
  name: string;
  fullName?: string;
  phoneNumber?: string;
  balance: number;
  registerDate: Date;
  isAccepted: boolean;
  history?: UserEvent[];
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const DeleteConfirmationModal = ({
  title = "Confirm Delete",
  message,
  isOpen,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
          <div className="flex justify-end mt-6 space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: "ascending" | "descending";
  }>({ key: "registerDate", direction: "descending" });
  const [balanceInput, setBalanceInput] = useState("");
  const [balanceType, setBalanceType] = useState<"Recharge" | "Discount">(
    "Recharge"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "accepted" | "pending"
  >("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters and sorting whenever users, searchTerm, sortConfig, or filterStatus changes
  useEffect(() => {
    let result = [...users];

    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter((user) =>
        filterStatus === "accepted" ? user.isAccepted : !user.isAccepted
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((user) => {
        return (
          (user.fullName &&
            user.fullName.toLowerCase().includes(searchLower)) ||
          user.name.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower) ||
          (user.telegramId && user.telegramId.includes(searchTerm)) ||
          (user.phoneNumber && user.phoneNumber.includes(searchTerm)) ||
          (user.chatId && user.chatId.includes(searchTerm))
        );
      });
    }

    // Apply sorting
    result.sort((a: any, b: any) => {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];

      if (valueA < valueB) return sortConfig.direction === "ascending" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(result);
  }, [users, searchTerm, sortConfig, filterStatus]);

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<User[]>("/users");
      setUsers(response || []);
      setFilteredUsers(response || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding or deducting balance
  const handleAddBalance = async (amount: number) => {
    if (selectedUser && amount) {
      setIsUpdating(true);
      try {
        await apiClient.put(`/users/${selectedUser._id}/balance`, {
          amount,
          adminAction: balanceType,
        });
        await fetchUsers();
        setBalanceInput("");
        setShowAddBalanceModal(false);
      } catch (error) {
        console.error("Error updating balance:", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        await apiClient.delete(`/users/${userToDelete._id}`);
        await fetchUsers();
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  // Handle accepting or rejecting a user
  const handleUserAction = async (userId: string, isAccepted: boolean) => {
    setIsUpdating(true);
    try {
      await apiClient.put(`/users/${userId}`, { isAccepted });
      await fetchUsers();
    } catch (error) {
      console.error(
        `Error ${isAccepted ? "accepting" : "rejecting"} user:`,
        error
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
    );
  };

  // Handle sorting
  const handleSort = (key: keyof User) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-800">
              User Management
            </h1>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-full"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border rounded-lg px-4 py-2 w-full sm:w-auto"
              >
                <option value="all">All Users</option>
                <option value="accepted">Accepted</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <FaSpinner className="animate-spin text-2xl text-blue-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center">
                  {/* Telegram ID */}
                  <div>
                    <p className="text-sm text-gray-500">Telegram ID</p>
                    <p className="font-medium">{user.telegramId}</p>
                  </div>

                  {/* Name */}
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{user.fullName || "N/A"}</p>
                  </div>

                  {/* Balance */}
                  <div>
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className="font-medium text-green-600">
                      {user.balance} Units
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isAccepted
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isAccepted ? "Accepted" : "Pending"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-4 justify-end">
                    {user.isAccepted ? (
                      <button
                        onClick={() => handleUserAction(user._id, false)}
                        className="p-2 rounded-full text-yellow-500 hover:bg-yellow-100 transition-colors"
                        title="Reject User"
                      >
                        <FaUserTimes className="text-xl" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(user._id, true)}
                        className="p-2 rounded-full text-green-500 hover:bg-green-100 transition-colors"
                        title="Accept User"
                      >
                        <FaUserCheck className="text-xl" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowHistoryModal(true);
                      }}
                      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                      title="View History"
                    >
                      <FaHistory className="text-xl" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowAddBalanceModal(true);
                      }}
                      className="p-2 rounded-full text-blue-500 hover:bg-blue-100 transition-colors"
                      title="Add Balance"
                    >
                      <FaPlusCircle className="text-xl" />
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(user);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                      title="Delete User"
                    >
                      <FaTrash className="text-xl" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditUserModal(true);
                      }}
                      className="p-2 rounded-full text-purple-500 hover:bg-purple-100 transition-colors"
                      title="Edit User"
                    >
                      <FaEdit className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Balance Modal */}
      {showAddBalanceModal && selectedUser && (
        <Modal
          title="Add Balance"
          onClose={() => setShowAddBalanceModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Select Action Type
              </label>
              <select
                value={balanceType}
                onChange={(e) =>
                  setBalanceType(e.target.value as "Recharge" | "Discount")
                }
                className="w-full p-2 border rounded"
              >
                <option value="Recharge">Recharge</option>
                <option value="Discount">Discount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Enter Amount (Units)
              </label>
              <input
                type="number"
                value={balanceInput.replace("-", "")}
                onChange={(e) =>
                  setBalanceInput(e.target.value.replace("-", ""))
                }
                className="w-full p-2 border rounded"
                min="0"
                placeholder="Enter positive value"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Current Balance: {selectedUser.balance} Units
              </p>
              <p className="text-sm text-gray-600">
                New Balance:{" "}
                {selectedUser.balance +
                  (balanceType === "Discount"
                    ? -(parseInt(balanceInput) || 0)
                    : parseInt(balanceInput) || 0)}{" "}
                Units
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddBalanceModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalAmount =
                    balanceType === "Discount"
                      ? -parseInt(balanceInput)
                      : parseInt(balanceInput);
                  handleAddBalance(finalAmount);
                }}
                disabled={!balanceInput || isUpdating}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <div className="flex items-center space-x-2">
                    <FaSpinner className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `${
                    balanceType === "Discount"
                      ? "Apply Discount"
                      : "Add Balance"
                  }`
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* User History Modal */}
      {showHistoryModal && selectedUser && (
        <Modal
          title={`User History - ${
            selectedUser.fullName || selectedUser.username
          }`}
          onClose={() => setShowHistoryModal(false)}
        >
          <div className="space-y-6">
            {/* User Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">User Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Username */}
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium">{selectedUser.username}</p>
                </div>

                {/* Name */}
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>

                {/* Full Name */}
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {selectedUser.fullName || "N/A"}
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">
                    {selectedUser.phoneNumber || "N/A"}
                  </p>
                </div>

                {/* Telegram ID */}
                <div>
                  <p className="text-sm text-gray-500">Telegram ID</p>
                  <p className="font-medium">{selectedUser.telegramId}</p>
                </div>

                {/* Register Date */}
                <div>
                  <p className="text-sm text-gray-500">Register Date</p>
                  <p className="font-medium">
                    {new Date(selectedUser.registerDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Balance */}
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="font-medium text-green-600">
                    {selectedUser.balance} Units
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.isAccepted
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedUser.isAccepted ? "Accepted" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction History Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Transaction History
              </h3>
              {selectedUser.history && selectedUser.history.length > 0 ? (
                <div className="space-y-4">
                  {/* Show only the last 5 transactions by default */}
                  {selectedUser.history
                    .slice(0, 5) // Limit to 5 entries for performance
                    .map((event, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          {/* Event Type and Date */}
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                event.type === "recharge"
                                  ? "bg-green-100 text-green-800"
                                  : event.type === "purchase"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {event.type.charAt(0).toUpperCase() +
                                event.type.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(event.date).toLocaleString()}
                            </span>
                          </div>

                          {/* Admin Action (if applicable) */}
                          {event.adminAction && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              {event.adminAction}
                            </span>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {event.amount && (
                            <p className="font-medium">
                              Amount: {event.amount} Units
                              {event.price && ` (${event.price} USD)`}
                            </p>
                          )}
                          {event.productName && (
                            <p>Product: {event.productName}</p>
                          )}
                          {event.categoryName && (
                            <p>Category: {event.categoryName}</p>
                          )}
                          {event.emailSold && (
                            <p className="break-all">
                              Email: {event.emailSold}
                            </p>
                          )}
                          {event.status && <p>Status: {event.status}</p>}
                        </div>
                      </div>
                    ))}

                  {/* Show a "Load More" button if there are more than 5 entries */}
                  {selectedUser.history.length > 5 && (
                    <button
                      onClick={() => {
                        // Load more logic here (e.g., fetch additional history entries)
                      }}
                      className="w-full py-2 text-center text-blue-500 hover:bg-blue-50 rounded-lg"
                    >
                      Load More
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No transaction history available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <DeleteConfirmationModal
          title="Delete User"
          message={`Are you sure you want to delete ${
            userToDelete.fullName || userToDelete.username
          }? This action cannot be undone.`}
          isOpen={showDeleteModal}
          onConfirm={handleDeleteUser}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
        />
      )}
      {showEditUserModal && selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          isOpen={showEditUserModal}
          onClose={() => setShowEditUserModal(false)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}
