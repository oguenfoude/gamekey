"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "../utils/apiClient"; // تأكد من أن لديك هذا الملف

interface User {
  _id: string;
  telegramId: string;
  username: string;
  history: {
    amount: number;
    date: string;
    description: string;
    type: string;
    productName?: string;
  }[];
  fullName?: string;
  phoneNumber?: string;
  balance: number;
  totalRecharge: number;
  registerDate: string;
  isActive: boolean;
  isAccepted: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/users");
        setUsers(response || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-center text-2xl font-bold mb-4">صفحة المستخدمين</h1>
        {isLoading ? (
          <div className="p-4 text-center">جارٍ التحميل...</div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="border-b border-gray-300 mb-4 pb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-lg text-blue-600">
                  {user.fullName} ({user.username})
                </h2>
                <span className="bg-green-200 text-green-800 rounded-full px-3 py-1 text-sm font-semibold">
                  {user.isActive ? "نشط" : "غير نشط"}
                </span>
              </div>
              <p className="text-gray-700">
                الرصيد: <strong>{user.balance}</strong> | إجمالي الشحن:{" "}
                <strong>{user.totalRecharge}</strong>
              </p>
              <div className="mt-4">
                <h3 className="font-semibold text-lg">تاريخ الشحن:</h3>
                {user.history && user.history?.length > 0 ? (
                  user.history.map((entry, index) => (
                    <div key={index} className="ml-4">
                      <div className="text-gray-600">
                        التاريخ: {new Date(entry.date).toLocaleDateString()} -
                        المبلغ: {entry.amount} - الوصف: {entry.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">لا توجد سجلات شحن متاحة.</p>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-lg">تاريخ الشراء:</h3>
                {user.history && user.history?.length > 0 ? (
                  user.history.map((entry, index) => (
                    <div key={index} className="ml-4">
                      <div className="text-gray-600">
                        التاريخ: {new Date(entry.date).toLocaleDateString()} -
                        المبلغ: {entry.amount} - المنتج: {entry.productName} -
                        الوصف: {entry.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">لا توجد سجلات شراء متاحة.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
