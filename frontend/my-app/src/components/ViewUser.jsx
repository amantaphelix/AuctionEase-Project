import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ViewUser.css';
import { Delete } from '@mui/icons-material';

const ViewUser = ({ match }) => {
  const [products, setProducts] = useState([]);
  const { userId } = useParams();
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log(userId)
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/viewuser/${userId}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, [userId]);

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/deleteBid/${productId}`);
      setProducts(products.filter((product) => product._id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="product-auction-container">
      <h1>User Products</h1>
      {products.length === 0 ? (
        <p>No products to display</p>
      ) : (
        <div className="product-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <button onClick={() => handleDelete(product._id)} className="delete-button"><Delete></Delete></button>
            <img src={product.imageUrl} alt={product.name} className="product-image" />
            <div className="product-details">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-starting-bid">Starting Bid: {product.startingBid}</p>
              <p className="product-current-bid">Current Bid: {product.currentBid}</p>
              <p className="product-end-time">End Time: {product.endTime}</p>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ViewUser;
