"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "./utils/apiClient";

export default function Home() {
  const router = useRouter();
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalCategories, setTotalCategories] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await apiClient.get("/products");
        setTotalProducts(products ? products.length : 0);
        const users = await apiClient.get("/users");
        setTotalUsers(users ? users.length : 0);
        const categories = await apiClient.get("/categories");
        setTotalCategories(categories ? categories.length : 0);
      } catch (error) {
        console.error("Error fetching data:", error);
        setTotalProducts(0);
        setTotalUsers(0);
        setTotalCategories(0);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col p-6 space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Products Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-4">Total Products</h2>
          <p className="text-4xl font-bold text-blue-600">
            {totalProducts ?? "Loading..."}
          </p>
          <button
            onClick={() => router.push("/products")}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            View Products
          </button>
        </div>

        {/* Users Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-4">Total Users</h2>
          <p className="text-4xl font-bold text-green-600">
            {totalUsers ?? "Loading..."}
          </p>
          <button
            onClick={() => router.push("/users")}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            View Users
          </button>
        </div>

        {/* Categories Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-4">Total Categories</h2>
          <p className="text-4xl font-bold text-purple-600">
            {totalCategories ?? "Loading..."}
          </p>
          <button
            onClick={() => router.push("/categories")}
            className="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
          >
            View Categories
          </button>
        </div>
      </section>
    </div>
  );
}
