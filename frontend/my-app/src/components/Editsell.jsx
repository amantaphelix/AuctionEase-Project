import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Editsell.css';

const EditSell = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: '',
    description: '',
    startingBid: '',
    endTime: '',
    category: '',
    imageUrl: '',
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/productdescription/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { name, description, startingBid, endTime, category, imageUrl } = response.data;

        // Format the date for the datetime-local input field
        const formattedEndTime = formatDateTime(endTime);

        setProduct({
          name,
          description,
          startingBid,
          endTime: formattedEndTime,
          category,
          imageUrl,
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        // Handle error here, e.g., navigate to an error page
      }
    };
    fetchProduct();
  }, [id]);

  const formatDateTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      const hours = `${date.getHours()}`.padStart(2, '0');
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/modifyBid/${id}`, product, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      window.alert('Changes saved successfully!');
      navigate('/sell');
    } catch (error) {
      console.error('Error editing product:', error);
      // Handle error here, e.g., display an error message to the user
    }
  };

  const handleCancel = () => {
    navigate('/sell');
  };
  
  return (
    <div className="edit-container">
      <div className="edit-left">
        <div className="edit-left-content">
          <h3>EDIT PRODUCT</h3>
        </div>
      </div>
      <div className="edit-right">
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="edit-form-group">
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" class="edit-input" value={product.name} onChange={handleChange} required />
          </div>
          <div className="edit-form-group">
            <label htmlFor="description">Description:</label>
            <textarea id="description" name="description" class="edit-input"  value={product.description} onChange={handleChange} required />
          </div>
          <div className="edit-form-group">
            <label htmlFor="startingBid">Starting Bid:</label>
            <input type="number" id="startingBid" name="startingBid" class="edit-input" value={product.startingBid} onChange={handleChange} required />
          </div>
          <div className="edit-form-group">
            <label htmlFor="endTime">End Time:</label>
            <input type="datetime-local" id="endTime" name="endTime" class="edit-input"  value={product.endTime} onChange={handleChange} required />
          </div>
          <div className="edit-form-group">
            <label htmlFor="category">Category:</label>
            <select id="category" name="category" class="edit-input"  value={product.category} onChange={handleChange} required>
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Art">Art</option>
              {/* Add more options as needed */}
            </select>
          </div>
          <div className="edit-form-group">
            <label htmlFor="image" > New Image:</label>
            <input type="file" accept="image/*" id="image" name="image" onChange={(e) => setProduct({ ...product, imageUrl: e.target.files[0] })} />
          </div>
          <div className="edit-button-container">
            <button type="submit" className="edit-button save" onClick={handleSubmit}>Save</button>
            <button type="button" className="edit-button cancel" onClick={handleCancel}>Cancel</button>
          </div>

        </form>
      </div>
      {product.imageUrl && (
        <div className="image-container">
          <img className="current-image" src={product.imageUrl} alt="Product" />
        </div>
      )}
    </div>
  );
}

export default EditSell;
