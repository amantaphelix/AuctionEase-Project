import React, { useState, useEffect } from 'react';
import './Profile.css';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const Profile = ({ userId }) => {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [reEnterNewPassword, setReEnterNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordRequirements, setPasswordRequirements] = useState([]);
    const [biddedProducts, setBiddedProducts] = useState([]);
    const [winningBiddedProducts, setWinningBiddedProducts] = useState([]);
    const [selectedProductType, setSelectedProductType] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUser(response.data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchBiddedProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/biddedProducts`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setBiddedProducts(response.data);
        } catch (error) {
            console.error('Error fetching bidded products:', error);
        }
    };

    const fetchWinningBiddedProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/winningBiddedProducts`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setWinningBiddedProducts(response.data);
        } catch (error) {
            console.error('Error fetching winning bidded products:', error);
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setCurrentPassword('');
        setNewPassword('');
        setReEnterNewPassword('');
        setPasswordError('');
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentPassword('');
        setNewPassword('');
        setReEnterNewPassword('');
        setPasswordError('');
    };

    const handleSubmitPassword = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/checkPassword`, {
                password: currentPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.data.valid) {
                setPasswordError('Current password is incorrect');
                return;
            }

            if (newPassword !== reEnterNewPassword) {
                setPasswordError('New passwords do not match');
                return;
            }

            const isPasswordValid =
                newPassword.length >= 12 &&
                /[a-z]/.test(newPassword) &&
                /[A-Z]/.test(newPassword) &&
                /\d/.test(newPassword) &&
                /[@$!%*?&]/.test(newPassword);

            if (!isPasswordValid) {
                setPasswordError('New password does not meet the requirements');
                return;
            }

            await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/updatePassword`, {
                password: newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setPasswordError('');
            setOpenDialog(false);
            setCurrentPassword('');
            setNewPassword('');
            setReEnterNewPassword('');
            alert('Password updated successfully');
        } catch (error) {
            console.error('Error updating password:', error);
            setPasswordError('Error updating password');
        }
    };

    const handleProductTypeClick = async (productType) => {
        setSelectedProductType(productType);
        switch (productType) {
            case 'bidded':
                await fetchBiddedProducts();
                break;
            case 'winning':
                await fetchWinningBiddedProducts();
                break;
            default:
                break;
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="profile-container">
            <div className="sidebar">
                <button onClick={() => handleProductTypeClick('bidded')}>Bidded Products</button>
                <button onClick={() => handleProductTypeClick('winning')}>Winning Bid Products</button>
            </div>

            <div className="main-content">
                <h1>Welcome, {user.username}</h1>
                <p>Email: {user.email}</p>
                <button className="change-password-button" onClick={handleOpenDialog}>
                    Change Password
                </button>
                <hr className="line" />

                <div className="product-list">
                    {selectedProductType === 'bidded' && biddedProducts.length > 0 && (
                        <div>
                            <h2>Bidded Products</h2>
                            <div className="product-grid">
                                {biddedProducts.map((product) => (
                                    <div key={product.id} className="product-card">
                                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                                        <div className="product-details">
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-bid">Current Bid: {product.currentBid}</p>
                                            <p className="product-category">Category: {product.category}</p>
                                            <p className="product-time">End Time: {product.endTime}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectedProductType === 'winning' && winningBiddedProducts.length > 0 && (
                        <div>
                            <h2>Winning Bidded Products</h2>
                            <div className="product-grid">
                                {winningBiddedProducts.map((product) => (
                                    <div key={product.id} className="product-card">
                                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                                        <div className="product-details">
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-bid">Winning Bid: {product.currentBid}</p>
                                            <p className="product-category">Category: {product.category}</p>
                                            <p className="product-time">End Time: {product.endTime}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Current Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <TextField
                        label="New Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <TextField
                        label="Re-enter New Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={reEnterNewPassword}
                        onChange={(e) => setReEnterNewPassword(e.target.value)}
                    />
                    {passwordError && <p className="error-message">{passwordError}</p>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmitPassword} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Profile;
