import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ReportedUsers = () => {
  const [reportedUsers, setReportedUsers] = useState([]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/api/admin/reportedUsers`)
      .then((res) => {
        setReportedUsers(res.data);
      })
      .catch((error) => {
        console.log('Error occurred while fetching reported users', error);
      });
  }, []);

  return (
    <div>
      <h1>Reported Users</h1>
      <ul>
        {reportedUsers.map((user) => (
          <li key={user._id}>
            <p>Name: {user.username}</p>
            <p>Email: {user.email}</p>
            {/* Include any other relevant information */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReportedUsers;
