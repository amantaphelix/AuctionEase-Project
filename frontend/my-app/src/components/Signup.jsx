// Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InfoIcon from '@mui/icons-material/Info';
import './Signup.css';
import { TextField, Box } from '@mui/material';
import Modal from './Modal';
import { IconButton, Tooltip } from '@mui/material';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [passwordRequirements, setPasswordRequirements] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordInfoClicked, setPasswordInfoClicked] = useState(false); // State to track if password info icon is clicked
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: inputValue
    }));

    if (name === 'password') {
      updatePasswordRequirements(value);
    }
  };

  const updatePasswordRequirements = (password) => {
    const requirements = [
      { text: 'At least 12 characters long', satisfied: password.length >= 12 },
      { text: 'Contain a combination of upper and lower-case letters', satisfied: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { text: 'Contain at least one digit', satisfied: /\d/.test(password) },
      { text: 'Contain at least one special character', satisfied: /[@$!%*?&]/.test(password) }
    ];
    setPasswordRequirements(requirements);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const togglePasswordRequirementsVisibility = () => {
    setShowPasswordRequirements(prevState => !prevState);
    setPasswordInfoClicked(true); // Set the state to true when info icon is clicked
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match. Please try again.");
      return;
    }

    const isPasswordValid = passwordRequirements.every(req => req.satisfied);

    if (!isPasswordValid) {
      alert("Password does not meet the requirements. Please ensure it meets all the criteria.");
      return;
    }
  
    if (!formData.agreeToTerms) {
      alert("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        if (response.status === 409) {
          alert(responseData.message); // Show the message sent from the backend
        } else {
          throw new Error('Error signing up. Please try again.');
        }
      } else {
        console.log("Signup response:", responseData);
        navigate('/login');
        alert("Signup successful! You can now login with your credentials.");
      }
    } catch (error) {
      console.error("Error signing up:", error.message);
      alert(error.message);
    }
  };
  

  return (
    <div className="signup-container">
      <div className="signup-left">
      <div className="signup-left-content">
    <h2>Welcome to Auctionease</h2>
    <p>Join our platform to discover amazing auctions!</p>
  </div>
      </div>
      <div className="signup-right">
        <h2>Create an Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="signup-form-group">
            <TextField
              label="Username"
              variant="standard"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="signup-form-group">
            <TextField
              label="Email"
              variant="standard"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="signup-form-group">
            <TextField
              label="Password"
              variant="standard"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <>
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                    <Tooltip title="Show password requirements">
                      <IconButton onClick={togglePasswordRequirementsVisibility} edge="end">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                ),
              }}
            />
            {passwordInfoClicked && showPasswordRequirements && ( // Check if info icon is clicked
              <Box mt={1}>
                {passwordRequirements.map((req, index) => (
                  <p key={index} className={req.satisfied ? 'requirement-satisfied' : 'requirement-unsatisfied'}>
                    {req.text}
                  </p>
                ))}
              </Box>
            )}
          </div>
          <div className="signup-form-group">
            <TextField
              label="Confirm Password"
              variant="standard"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                ),
              }}
            />
          </div>
          <div className="signup-form-group">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
            />
            <label htmlFor="agreeToTerms">
              <button 
                type="button" 
                className="link-button" 
                onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
              >
                I agree to the Terms of Service and Privacy Policy.
              </button>
            </label>
          </div>
          <button type="submit" className="signup-button">Create Account</button>
        </form>
        <div className="signup-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Signup;