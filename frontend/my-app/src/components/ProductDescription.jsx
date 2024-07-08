import React, { useState, useEffect } from "react";
import './ProductDescription.css';
import axios from "axios";
import { format } from 'date-fns-tz'; 
import { useParams } from "react-router-dom";
import { AiOutlineHeart } from "react-icons/ai";

const CountdownItem = ({ value, label }) => (
  <div className="countdown-item">
    <div className="value">{value}</div>
    <div className="label">{label}</div>
  </div>
);

const Countdown = () => {
  const countdownData = [
    { value: "02", label: "Hours" },
    { value: "00", label: "Minutes" },
    { value: "00", label: "Seconds" },
  ];

  return (
    <>
      <section className="countdown">
        <div className="countdown-container">
          {countdownData.map((item, index) => (
            <CountdownItem key={index} value={item.value} label={item.label} />
          ))}
        </div>
      </section>
    </>
  );
};

const ReportDialog = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit(reason);
  };

  return (
    <div className={`report-dialog ${isOpen ? 'open' : ''}`}>
      <div className="dialog-content product-details">
        <h2>Report User</h2>
        <textarea
          value={reason}
          onChange={handleReasonChange}
          placeholder="Enter your reason for reporting this user"
          className="description"
        ></textarea>
        <div className="button-container actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};


const ProductDescriptionPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [userBids, setUserBids] = useState([]);
  const [winningBid, setWinningBid] = useState(null);
  const isAuctionEnded = remainingTime === 0;
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);


  const fetchProductDetails = async () => {
    try {
      const productResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/productdescription/${id}`);
      const productData = productResponse.data;
      setProduct(productData);
      calculateRemainingTime(productData.endTime);
      fetchBiddingHistory();
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (isAuctionEnded && product) {
      fetchWinningBid();
    }
  }, [isAuctionEnded, product]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);
  
  const fetchBiddingHistory = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/history/${id}`);
      setUserBids(response.data.biddingHistory);
    } catch (error) {
      console.error("Error fetching bidding history:", error);
    }
  };

  const fetchWinningBid = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/getWinningBid/${id}`);
      setWinningBid(response.data.winningBid);
    } catch (error) {
      console.error("Error fetching winning bid:", error);
    }
  };

  const sendEmails = async (productId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/sendEmails/${productId}`);
      console.log(response.data); // Assuming the response contains a message confirming the emails were sent successfully
      // Optionally, you can handle UI updates or display a success message to the user
    } catch (error) {
      console.error('Error sending emails:', error);
      // Optionally, handle errors and display error messages to the user
    }
  };

  const calculateRemainingTime = (endTime) => {
    const endTimeInMilliseconds = new Date(endTime).getTime();
    const currentTime = new Date().getTime();
    const difference = endTimeInMilliseconds - currentTime;

    setRemainingTime(Math.max(0, Math.floor(difference / 1000)));
  };

  const handleReportSeller = () => {
    setIsReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    setIsReportDialogOpen(false);
  };

  const handleSubmitReport = async (reason) => {
    try {
      // Call the backend endpoint to report the user
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/reportUser/${id}`);
  
      // Close the report dialog
      handleCloseReportDialog();
  
      // Optionally, you can show a success message to the user
      alert('User reported successfully!');
    } catch (error) {
      console.error('Error reporting seller:', error);
      // Optionally, handle errors and display error messages to the user
    }
  };


  const handlePlaceBid = async (e) => {
    e.preventDefault();
  
    if (parseFloat(bidAmount) <= parseFloat(product.currentBid)) {
      alert('Your bid amount must be greater than the current bid.');
      return;
    }
  
    const requestBody = { bidAmount };
    const token = localStorage.getItem('token');
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/bids/${id}`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.status >= 200 && response.status < 300) {
        console.log('Bid added successfully!');
        // Fetch updated product details and bidding history
        fetchProductDetails();
        setBidAmount('');
        document.getElementById('bidInput').placeholder = '';
        alert('Bid added successfully!');
      } else {
        console.error('Failed to add Bid:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding bid:', error);
    }
  };

  const formatRemainingTime = () => {
    const days = Math.floor(remainingTime / (3600 * 24));
    const hours = Math.floor((remainingTime % (3600 * 24)) / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    let formattedTime = '';
    if (days > 0) {
      formattedTime += `${days} ${days === 1 ? 'day' : 'days'} `;
    }
    if (hours > 0) {
      formattedTime += `${hours} ${hours === 1 ? 'hour' : 'hours'} `;
    }
    if (minutes > 0) {
      formattedTime += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} `;
    }
    if (seconds > 0) {
      formattedTime += `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    }

    const message = formattedTime.trim() === '' ? 'Auction ended' : `Left: ${formattedTime} hurry up`;

    return message;
  };

  return (
    <div className="product-description-page">
      {product && (
        <div>
          <div className="product-image">
            <img src={product.imageUrl} alt="Product" />
          </div>
          <div className="description-right">
            <h1>{product.name}</h1>
            <h2>Current Bid: {product.currentBid}</h2>
            <div className="countdown">
              <h2>Time Left: {formatRemainingTime()}</h2>
            </div>
            <div className="description">
              <h2>Description</h2>
              <p>{product.description}</p>
              <p>Posted by: {product.userId.username}</p> {/* Display username of the poster */}
            </div>

            {/* Button to report user */}
            <button className="report-user-button" onClick={handleReportSeller}>Report User</button>

            {isReportDialogOpen && (
              <ReportDialog 
                isOpen={isReportDialogOpen} 
                onClose={handleCloseReportDialog} 
                onSubmit={handleSubmitReport} 
              />
            )}

            {/* Conditionally render bid section */}
            {isAuctionEnded ? (
              <div className="auction-ended-message">
                <h2>Auction Ended</h2>
                {/* Display winning bid details */}
                {winningBid ? (
                  <div className="winning-bid">
                    <h2>Winning Bid</h2>
                    <p>Amount: {winningBid.bidAmount}</p>
                    <p>Username: {winningBid.userId.username}</p>
                    <p>Email: {winningBid.userId.email}</p>
                  </div>
                ) : (
                  <p>No winning bid yet.</p>
                )}
              </div>
            ) : (
              <div className="bid-section">
                <h2>Bid Now</h2>
                <input
                  className="bid-input"
                  type="text"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount"
                  id="bidInput"
                />
                <button onClick={handlePlaceBid} style={{ marginLeft: '10px' }}>Place Bid</button>
              </div>
            )}
            {/* Conditionally render bidding history */}
            {!isAuctionEnded && userBids && userBids.length > 0 ? (
              <div className="bidding-history">
                <h2>Bidding History</h2>
                {userBids.map((bid, index) => (
                  <div key={index} className="bid-item">
                    <span className="user-name">{bid.userId.username}</span>
                    <span className="amount">{bid.bidAmount}</span>
                    <span className="time">{new Date(bid.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {userBids && userBids.length === 0 && (
              <p>No bids yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDescriptionPage;
