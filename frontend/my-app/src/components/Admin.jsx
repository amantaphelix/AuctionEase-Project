import React, { useEffect, useState } from 'react';
import { Table, TableCell, TableContainer, TableHead, TableBody, TableRow, Button } from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch the list of registered users from the server
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/users`)
      .then((res) => {
        setUsers(res.data);
      })
      .catch((error) => {
        console.log('Error occurred while fetching users', error);
      });
  }, []);

  const handleBlockUser = (userId) => {
    axios
      .post(`${process.env.REACT_APP_API_BASE_URL}/blockUser/${userId}`)
      .then((res) => {
        console.log('User blocked successfully');
        window.alert('User blocked successfully');
        // Update the users state to reflect the change in user status
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, status: 'blocked' } : user
          )
        );
      })
      .catch((error) => {
        console.log('Error occurred while blocking user:', error);
      });
  };
  
  const handleUnblockUser = (userId) => {
    axios
      .post(`${process.env.REACT_APP_API_BASE_URL}/unblockUser/${userId}`)
      .then((res) => {
        console.log('User unblocked successfully');
        window.alert('User unblocked successfully');
        // Update the users state to reflect the change in user status
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, status: 'unblocked' } : user
          )
        );
      })
      .catch((error) => {
        console.log('Error occurred while unblocking user:', error);
      });
  };
  

  

  const handleDeleteUser = (userId) => {
    axios
      .delete(`${process.env.REACT_APP_API_BASE_URL}/delete/${userId}`)
      .then((response) => {
        console.log('User deleted successfully');
        window.alert('User deleted successfully');
        // Update the users state to remove the deleted user
        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      })
      .catch((error) => {
        console.log('Error occurred while deleting user:', error);
      });
  };

  return (
    <div className="admin-container">
      <h1 className="admin-header">User Details</h1>
      <TableContainer>
        <Table className="admin-table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email ID</TableCell>
              <TableCell>Reports</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.ifreported}</TableCell>
                <TableCell>
                  <Button onClick={() => user.status === 'blocked' ? handleUnblockUser(user._id) : handleBlockUser(user._id)}>
                    {user.status === 'blocked' ? 'Unblock' : 'Block'}
                  </Button>
                  <Button onClick={() => handleDeleteUser(user._id)}>Delete</Button>
                  <Link to={`/viewuser/${user._id}`} className="view-products-link"><Button>View Products</Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Admin;