import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns-tz'; 
import { Link, NavLink } from 'react-router-dom';
import './Sell.css'
import { Delete, Edit } from '@mui/icons-material';

const Sell = () => {
  const [products, setProducts] = useState([]);
  const [ongoingAuctions, setOngoingAuctions] = useState([]);
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [showOngoing, setShowOngoing] = useState(true); // Default to showing ongoing auctions

  const formatLocalTime = (utcTime) => {
    return format(new Date(utcTime), 'yyyy-MM-dd HH:mm', { timeZone: 'your-local-timezone' });
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/sell`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    // Separate ongoing and ended auctions
    const ongoing = [];
    const ended = [];
    products.forEach(product => {
      if (new Date(product.endTime) > new Date()) {
        ongoing.push(product);
      } else {
        ended.push(product);
      }
    });
    setOngoingAuctions(ongoing);
    setEndedAuctions(ended);
  }, [products]);

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/deleteBid/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(products.filter((product) => product._id !== productId));
      window.alert('Deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="product-auction-container">
      <div className="add-product-container">
        <Link to="/create" className="add-product-button">Add a Product</Link>
      </div>

      <div className="toggle-buttons">
        <button className={showOngoing ? "toggle-button active" : "toggle-button"} onClick={() => setShowOngoing(true)}>Ongoing Auctions</button>
        <button className={!showOngoing ? "toggle-button active" : "toggle-button"} onClick={() => setShowOngoing(false)}>Ended Auctions</button>
      </div>

      <div>
        {showOngoing ? (
          <div>
            <h1 className="sell-heading">Ongoing Auctions</h1>
            <div className="sell-grid">
              {ongoingAuctions.map((product) => (
                <ProductCard key={product._id} product={product} handleDelete={handleDelete} formatLocalTime={formatLocalTime} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="sell-heading">Ended Auctions</h1>
            <div className="sell-grid">
              {endedAuctions.map((product) => (
                <ProductCard key={product._id} product={product} handleDelete={handleDelete} formatLocalTime={formatLocalTime} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const ProductCard = ({ product, handleDelete, formatLocalTime }) => {
  return (
    <div className="sell-card">
      <div className="action-buttons">
        <button onClick={() => handleDelete(product._id)} className="action-button"><Delete /></button>
        <Link to={`/editsell/${product._id}`} className="action-button1"><Edit /></Link>
      </div>
      <img src={product.imageUrl} alt={product.name} className="sell-image" />
      <div className="sell-details">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-starting-bid">Starting Bid: {product.startingBid}</p>
        <p className="product-current-bid">Current Bid: {product.currentBid}</p>
        <p className="product-end-time">End Time: {formatLocalTime(product.endTime)}</p>
      </div>
    </div>
  );
};

export default Sell;
