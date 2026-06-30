// src/app/notifications/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

interface Notification {
  _id: string;
  title: string;
  message: string;
  notificationHistory?: NotificationHistoryEntry[];
}

interface NotificationHistoryEntry {
  date: string;
  description: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newNotificationData, setNewNotificationData] = useState({
    title: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch notifications from the server
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/notifications");
      setNotifications(response || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setIsLoading(false);
    }
  };

  // Function to handle the creation of a new notification
  const handleCreateNotification = async () => {
    try {
      const { title, message } = newNotificationData;

      // Validation
      if (!message) {
        alert("Message is required.");
        return;
      }

      const notificationData = {
        title,
        message,
      };

      await apiClient.post("/notifications", notificationData);
      resetFormData();
      setShowCreateModal(false);
      fetchNotifications();
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Function to open the edit modal with selected notification's data
  const handleEditClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setNewNotificationData({
      title: notification.title,
      message: notification.message,
    });
    setShowEditModal(true);
  };

  // Function to save edits to the selected notification
  const handleSaveEdit = async () => {
    if (selectedNotification) {
      try {
        const { title, message } = newNotificationData;

        // Validation
        if (!message) {
          alert("Message is required.");
          return;
        }

        const updatedNotificationData = {
          title,
          message,
        };

        await apiClient.put(
          `/notifications/${selectedNotification._id}`,
          updatedNotificationData
        );

        resetFormData();
        setShowEditModal(false);
        fetchNotifications();
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    }
  };

  // Function to confirm deletion of a notification
  const handleDeleteClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDeleteModal(true);
  };

  // Function to delete the selected notification
  const handleConfirmDelete = async () => {
    if (selectedNotification) {
      try {
        await apiClient.delete(`/notifications/${selectedNotification._id}`);
        setSelectedNotification(null);
        setShowDeleteModal(false);
        fetchNotifications();
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    }
  };

  const handleSendNotification = async (notification: Notification) => {
    try {
      await apiClient.post(`/notifications/${notification._id}/send`, {}); // Pass an empty object as the second argument
      alert("Notification sent to all users.");
      fetchNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification.");
    }
  };

  // Helper function to reset form data to initial state
  const resetFormData = () => {
    setNewNotificationData({
      title: "",
      message: "",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {/* Button to open the Create Notification Modal */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-green-500 text-white px-6 py-2 rounded-lg mb-4 shadow hover:bg-green-600 transition"
      >
        Add New Notification
      </button>

      {/* Notifications Table */}
      {isLoading ? (
        <p>Loading notifications...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-left text-sm font-semibold uppercase">
                <th className="p-4 border-b">Title</th>
                <th className="p-4 border-b">Message</th>
                <th className="p-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr
                  key={notification._id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="p-4 border-b">{notification.title}</td>
                  <td className="p-4 border-b">{notification.message}</td>
                  <td className="p-4 border-b space-x-2">
                    <button
                      onClick={() => handleEditClick(notification)}
                      className="bg-blue-500 text-white px-3 py-1 rounded shadow hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(notification)}
                      className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleSendNotification(notification)}
                      className="bg-purple-500 text-white px-3 py-1 rounded shadow hover:bg-purple-600 transition"
                    >
                      Send
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-screen">
            <h2 className="text-2xl font-bold mb-6">Add New Notification</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newNotificationData.title}
                onChange={(e) =>
                  setNewNotificationData({
                    ...newNotificationData,
                    title: e.target.value,
                  })
                }
                placeholder="Title"
                className="w-full p-3 border border-gray-300 rounded"
              />
              <textarea
                value={newNotificationData.message}
                onChange={(e) =>
                  setNewNotificationData({
                    ...newNotificationData,
                    message: e.target.value,
                  })
                }
                placeholder="Message"
                className="w-full p-3 border border-gray-300 rounded resize-y"
                rows={6}
              />
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetFormData();
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotification}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Add Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notification Modal */}
      {showEditModal && selectedNotification && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-screen">
            <h2 className="text-2xl font-bold mb-6">Edit Notification</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newNotificationData.title}
                onChange={(e) =>
                  setNewNotificationData({
                    ...newNotificationData,
                    title: e.target.value,
                  })
                }
                placeholder="Title"
                className="w-full p-3 border border-gray-300 rounded"
              />
              <textarea
                value={newNotificationData.message}
                onChange={(e) =>
                  setNewNotificationData({
                    ...newNotificationData,
                    message: e.target.value,
                  })
                }
                placeholder="Message"
                className="w-full p-3 border border-gray-300 rounded resize-y"
                rows={6}
              />
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetFormData();
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-6 text-center">
              Are you sure you want to delete this notification?
            </h2>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
