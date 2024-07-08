//Login.jsx
import React, { useState } from 'react';
import './Login.css';
import Logb from '../assets/logb.jpg';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
const Login = ({ setLoginUser,setIsAdmin }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
      email: '',
      password: ''
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setUser((prevState) => ({
        ...prevState,
        [name]: value
      }));
    };
  
    const handleLogin = () => {
      if (user.email === 'auctioneaseplatform@gmail.com' && user.password === 'admin@123') {
        // If the login is for admin
        setLoginUser(true);
        setIsAdmin(true);
        navigate('/Admin');
      } else {
        axios
          .post(`${process.env.REACT_APP_API_BASE_URL}/api/login`, user)
          .then((res) => {
            const { message, token, blocked } = res.data;
            if (blocked) {
              alert("Can't login. User is blocked.");
            } else {
              alert(message);
              // Store token in local storage
              localStorage.setItem('token', token);
              // Redirect to home page
              setLoginUser(true);
              setIsAdmin(false);
              navigate('/home');
            }
          })
          .catch((error) => {
            if (error.response && error.response.data) {
              alert(error.response.data.message);
            } else {
              console.log('Error occurred during login', error);
            }
          });
      }
    };
    
    const handleForgotPassword = () => {
       
        const newPassword = generateRandomPassword(12);
        axios
          .post(`${process.env.REACT_APP_API_BASE_URL}/api/forgotpassword`, { email: user.email ,newPassword})
          .then((res) => {
            alert(res.data.message); // Alert message from the backend
          })
          .catch((error) => {
            if (error.response && error.response.data) {
              alert(error.response.data.message); // Error message from the backend
            } else {
              console.log('Error sending forgot password request:', error);
            }
          });
      };


      const generateRandomPassword = (length) => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          password += charset[randomIndex];
        }
        return password;
      };
      
      
      
    return (
      <div className="login-container">
        <div className="login-left">
          <img src={Logb} alt="Logo" className="login-logo" />
        </div>
        <div className="login-right">
          <h2>Login</h2>
          <h4>Welcome Back! Please enter your details.</h4>
          <form>
            <div className="login-form-group">
              <TextField
                label="Email"
                variant="standard"
                name="email"
                placeholder="Email"
                value={user.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="login-form-group">
              <TextField
                label="Password"
                variant="standard"
                name="password"
                placeholder="Password"
                type="password"
                value={user.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="forgot-password">
            <button type="button" className="button-like" onClick={handleForgotPassword}>
                        Forgot Password?
                    </button>

            </div>
            <br />
            <button type="button" className="login-button" onClick={handleLogin}>
              Log in
            </button>
          </form>
          <div className="signup-link">
            <span>Don't have an account?</span>
            <Link to="/SignUp" className="black-link">
                        Sign up for free
            </Link>
          </div>
        </div>
      </div>
    );
};

export default Login;
