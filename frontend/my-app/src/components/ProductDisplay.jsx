// ProductDisplay.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ProductDisplay.css"; // Import the CSS file for ProductDisplay
import { Link } from "react-router-dom";

const ProductDisplay = () => {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/productdisplay`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
          // Filter out products whose auction has not ended
          const filteredProducts = response.data.filter(product => new Date(product.endTime) > new Date());
          setProducts(filteredProducts);
          } catch (error) {
          console.error("Error fetching products:", error);
          }
          };

    fetchProducts();
  }, []);

  const handleSearchInputChange = (event) => {
    setSearchInput(event.target.value);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  const formatRemainingTime = (endTime) => {
    const endTimeInMilliseconds = new Date(endTime).getTime();
    const currentTime = new Date().getTime();
    const difference = endTimeInMilliseconds - currentTime;

    if (difference <= 0) {
      return 'Auction ended';
    }

    const days = Math.floor(difference / (3600 * 24 * 1000));
    const hours = Math.floor((difference % (3600 * 24 * 1000)) / (3600 * 1000));
    const minutes = Math.floor((difference % (3600 * 1000)) / (60 * 1000));
    const seconds = Math.floor((difference % (60 * 1000)) / 1000);

    return `Bid Ends In: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  };

  return (
    <div className="product-grid">
      {/* Product cards */}
      {filteredProducts.map((product) => (
        <div key={product.id} className="product-card">
          <img src={product.imageUrl} alt={product.name} className="product-image" />
          <div className="product-details">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-bid">Current Bid: {product.currentBid}</p>
            <p className="product-category">Category: {product.category}</p>
            <p className="product-time">{formatRemainingTime(product.endTime)}</p>
            <Link to={`/productdescription/${product._id}`} className="view-product-button">View Product</Link></div>
        </div>
      ))}
    </div>
);
};


export default ProductDisplay;
