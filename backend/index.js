//Backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const app = express();
const cloudinary = require('cloudinary').v2;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cron = require('node-cron');
app.use(cors());

require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});

app.use(express.json());

// User schema

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  status: {
    type: String,
    enum: ['blocked', 'unblocked'],
    required: true,
    default: 'unblocked',
  },
  ifreported: {
    type: Number,
    default: 0,
  },
});

// Bids schema
const bidsSchema = new mongoose.Schema({
  name: String,
  category: String, // Category of the bid
  description: String,
  startingBid: Number,
  currentBid: { type: Number, default: this.startingBid }, // Initially set to starting bid
  endTime: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: String ,
  emailsSent: {
    type: Boolean,
    default: false, // Default value is false
  }
});

const userbidsSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user who placed the bid
  bidAmount: Number,
  isWinningBid: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});


const Userbid = mongoose.model('Userbid', userbidsSchema);

const Bid = mongoose.model('Bid', bidsSchema);

const User = mongoose.model('User', userSchema);


cloudinary.config({
  cloud_name: 'dk3ryoigu',
  api_key: '558444457372669',
  api_secret: 'yFYHAaS6HTJL6SwhxElLW7rOPPs'
});


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'auctioneaseplatform@gmail.com', 
      pass: 'wqib pose sunz yjoz', 
    },
  });
// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists in the database' });
    }
   
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username:req.body.username,
      email:req.body.email,
      password: hashedPassword
    });

    // Save the new user
    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await sendWelcomeEmail(newUser.email);
    res.status(200).json({ message: 'User successfully registered!' });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Email does not exist' });
  }

  if (user.status === 'blocked') {
    return res.status(401).json({ message: 'User blocked by admin' });
  }

  // Compare the passwords
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Incorrect password' });
  }
  const token = jwt.sign({email:user.email, userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  res.status(200).json({ message: 'Login successful!' ,token:token});
});

// Forgot password endpoint
app.post('/api/forgotpassword', async (req, res) => {
    const { email } = req.body;
    
    try {
        const newPassword = generateNewPassword();
      // Call the sendForgotPasswordEmail function
      await sendForgotPasswordEmail(email,newPassword);
  
      res.status(200).json({ message: 'Email sent successfully to your registered emailid' });
    } catch (error) {
      console.error('Error sending forgot password email:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  const generateNewPassword = () => {
    const randomBytes = crypto.randomBytes(8);
    return randomBytes.toString('hex');
  };
const sendForgotPasswordEmail = async (email,newPassword) => {
    try {
      // Check if the email exists in the database
      const user = await User.findOne({ email });
  
      if (!user) {
        console.error('Email not found');
        return;
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the user's password in the database
      user.password = hashedPassword;
      await user.save();
  
      const mailOptions = {
        from: 'auctioneaseplatform.com', // Sender email address
        to: email,
        subject: 'Password Reset',
        text: `Dear user, we have received a forgot password request for your account. Your new password is: ${newPassword} Please do not share your password with anyone. We thank you for using our Online Auction System AuctionEase.`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return;
        }
  
        console.log('Email sent:', info.response);
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };
  

  const sendWelcomeEmail = (email) => {
    const mailOptions = {
      from: 'auctioneaseplatform@gmail.com',
      to: email,
      subject: 'Welcome to AuctionEase - Online Auction System',
      text: `Dear user, Welcome to AuctionEase, the ultimate online auction system. Explore exciting features and start bidding on your favorite items. Thank you for choosing AuctionEase!`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending welcome email:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      console.log('Welcome email sent:', info.response);
      return res.status(200).json({ message: 'Welcome email sent successfully' });
    });
  };
  // Define the endpoint for adding a bid
app.post('/api/addBid', (req, res) => {
  const {name,description,startingBid,endTime,category,imageUrl} = req.body;
  console.log("Received data:", req.body);

  const userId = getUserIdFromAuthentication(req);

  const newBid = new Bid({
    name,
    description,
    startingBid,
    currentBid: startingBid,
    endTime,
    userId,
    category,
    imageUrl, // Store the secure URL returned by Cloudinary
  });

  newBid.save()
    .then(savedBid => {
      res.status(200).json({ message: 'Bid added successfully', bid: savedBid });
    })
    .catch(error => {
      console.error('Error adding bid:', error);
      res.status(500).json({ message: 'Internal server error' });
    });
});

  
  
  const getUserIdFromAuthentication = (req) => {
    // Extract user ID from JWT token in request headers
    const token = req.headers.authorization.split(' ')[1]; // Assuming JWT token is in the format: Bearer <token>
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  };

  app.get('/api/productdisplay', async (req, res) => {
    try {
      // Retrieve the user ID from the request or authentication context
      const userId = getUserIdFromAuthentication(req); // You need to implement this function
  
      // Fetch products excluding those added by the logged-in user and whose endTime has not passed
      const products = await Bid.find({ 
        userId: { $ne: userId },
        endTime: { $gt: new Date() } // Filter out products with endTime greater than current time
      }).select('-userId');
        
      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/modifyBid/:id', async (req, res) => {
    const bidId = req.params.id;
    const { name, description, startingBid, endTime, category, imageUrl } = req.body;
  
    try {
      // Fetch the bid
      const bid = await Bid.findById(bidId);
  
      if (!bid) {
        return res.status(404).json({ message: 'Bid not found' });
      }
  
      // Check if bidding has ended
      if (bid.endTime && new Date(bid.endTime) < new Date()) {
        return res.status(400).json({ message: 'Bidding for this product has already ended. Modification not allowed.' });
      }
  
      // Update startingBid and currentBid
      bid.name = name;
      bid.description = description;
      bid.startingBid = startingBid;
      bid.currentBid = startingBid;
      bid.endTime = endTime;
      bid.category = category;
      bid.imageUrl = imageUrl;

      // Save the updated bid
      const updatedBid = await bid.save();
  
      res.status(200).json({ message: 'Bid modified successfully', bid: updatedBid });
    } catch (error) {
      console.error('Error modifying bid:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
// Delete Bid endpoint
const { ObjectId } = require('mongoose').Types;

// Delete Bid endpoint
app.delete('/api/deleteBid/:id', async (req, res) => {
    const bidId = req.params.id;

    try {
        // Check if the provided ID is valid
        if (!ObjectId.isValid(bidId)) {
            return res.status(400).json({ message: 'Invalid bid ID' });
        }

        // Delete bid by ID
        const deletedBid = await Bid.findByIdAndDelete(bidId);

        if (!deletedBid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        res.status(200).json({ message: 'Bid deleted successfully', bid: deletedBid });
    } catch (error) {
        console.error('Error deleting bid:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

  app.get('/api/sell', async (req, res) => {
    try {
      // Retrieve the user ID from the request or authentication context
      const userId = getUserIdFromAuthentication(req); // You need to implement this function
  
      // Fetch products added by the logged-in user
      const products = await Bid.find({ userId });
  
      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/viewuser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const products = await Bid.find({ userId });
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


  app.get('/users', async (req, res) => {
    try {
      const users = await User.find({}).exec();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error occurred while fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  });

app.delete('/delete/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
  
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error occurred while deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

app.get('/api/productdescription/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      // Fetch product details from the database based on the product ID
      const product = await Bid.findById(productId).populate('userId');
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Route to place a bid
app.post('/api/bids/:id', async (req, res) => {
  const productId = req.params.id;

  const userId = getUserIdFromAuthentication(req);
  if (!req.body.bidAmount || isNaN(req.body.bidAmount)) {
    return res.status(400).json({ message: 'Invalid bid amount. Please enter a number.' });
  }

  let session; 

  try {
    // Start a MongoDB session
    session = await mongoose.startSession();
    session.startTransaction();

    // Find the previous winning bid
    const previousWinningBid = await Userbid.findOne({ productId, isWinningBid: true });

    // If there's a previous winning bid, mark it as not winning anymore
    if (previousWinningBid) {
      previousWinningBid.isWinningBid = false;
      await previousWinningBid.save();
    }

    // Create a new bid document
    const newBid = new Userbid({
      productId,
      bidAmount: Number(req.body.bidAmount), // Accessing directly from request body
      userId,
      isWinningBid: true // Set isWinningBid to true for every new bid
    });

    // Save the new bid
    const savedBid = await newBid.save();

    // Update the current bid in the product document
    const product = await Bid.findByIdAndUpdate(productId, { currentBid: savedBid.bidAmount }, { new: true }).session(session);

    // Check if the auction has ended
    const currentTime = new Date();
    if (currentTime >= new Date(product.endTime)) {
      // Mark the latest bid as the winning bid
      newBid.isWinningBid = true;
      await newBid.save();
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Bid added successfully', bid: savedBid });
  } catch (error) {
    console.error('Error adding bid:', error);
    // If an error occurs, abort the transaction
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a new endpoint to get winning bid details for a specific product
app.get('/api/getWinningBid/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Find the winning bid for the specified product
    const winningBid = await Userbid.findOne({ productId, isWinningBid: true })
      .select('userId bidAmount timestamp')
      .populate('userId', 'email username');

    if (!winningBid) {
      return res.status(404).json({ message: 'No winning bid found.' });
    }

    res.status(200).json({ winningBid });
  } catch (error) {
    console.error('Error fetching winning bid details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Scheduling the task to run every minute 
cron.schedule('* * * * *', async () => {
  try {
    // Find all products where the auction end time is in the past
    const endedProducts = await Bid.find({ endTime: { $lt: new Date() }, emailsSent: { $ne: true } });

    // Process each ended product
    for (const product of endedProducts) {
      const productId = product._id;

      // Find the winning bid for the product
      const winningBid = await Userbid.findOne({ productId, isWinningBid: true })
        .select('userId bidAmount timestamp')
        .populate('userId', 'email username');

      if (!winningBid) {
        console.log('No winning bid found for product:', productId);
        continue;
      }

      // Fetch product details including userId
const productDetails = await Bid.findById(productId).populate('userId', 'email username');

if (!productDetails.userId || !productDetails.userId.email) {
  console.log('Seller email not found for product:', productId);
  continue; // Skip sending email to seller if email is not found
}

// Extract the seller's email from the product details
const sellerEmail = productDetails.userId.email;
const sellerUsername = productDetails.userId.username;

      // Email to the winning bidder
      const buyerMailOptions = {
        from: 'auctioneaseplatform@gmail.com',
        to: winningBid.userId.email,
        subject: 'Congratulations! You won the bid!',
        text: `Dear ${winningBid.userId.username},\n\nCongratulations! You have won the bid for the product. Here are the details:\n\n` +
              `Bid Amount: ${winningBid.bidAmount}\n` +
              `Time of Bid: ${winningBid.timestamp}\n\n` +
              `Please proceed with the payment and contact the seller ${sellerUsername} (${sellerEmail}) for further instructions.\n\n` +
              `Thank you for using our auction platform.\n\nBest regards,`
      };

      // Email to the seller
      const sellerMailOptions = {
        from: 'auctioneaseplatform@gmail.com',
        to: sellerEmail,
        subject: 'Your product has been sold!',
        text: `Dear ${sellerUsername},\n\nCongratulations! Your product has been sold. Here are the details of the winning bid:\n\n` +
              `Bid Amount: ${winningBid.bidAmount}\n` +
              `Time of Bid: ${winningBid.timestamp}\n\n` +
              `The winning bidder's details:\n` +
              `Username: ${winningBid.userId.username}\n` +
              `Email: ${winningBid.userId.email}\n\n` +
              `Please contact the winning bidder for further arrangements.\n\n` +
              `Thank you for using our auction platform.\n\nBest regards,`
      };

      // Send emails to both parties
      await Promise.all([
        transporter.sendMail(buyerMailOptions),
        transporter.sendMail(sellerMailOptions)
      ]);

      console.log('Emails sent to winning bidder and seller for product:', productId);

      // Update the product status to indicate that emails have been sent
      await Bid.findByIdAndUpdate(productId, { $set: { emailsSent: true } });
    }
  } catch (error) {
    console.error('Error sending emails:', error);
  }
});

// GET endpoint to fetch bidding history records for a specific product ID

app.get('/api/history/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Query the database for bidding history records with the provided product ID
    const biddingHistory = await Userbid.find({ productId })
      .select('userId bidAmount timestamp')
      .sort({ timestamp: 'desc' })
      .populate('userId', 'username');

    res.status(200).json({ biddingHistory }); // Updated: Correctly return biddingHistory data
  } catch (error) {
    console.error('Error fetching bidding history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/unblockUser/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    user.status = 'unblocked'; // Update status to 'unblocked'
    await user.save();
  
    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error occurred while unblocking user:', error);
    res.status(500).json({ message: 'Failed to unblock user', error: error.message });
  }
});


app.post('/blockUser/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    user.status = 'blocked';
    await user.save();
  
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error occurred while blocking user:', error);
    res.status(500).json({ message: 'Failed to block user', error: error.message });
  }
});

// Admin View

app.get('/api/admin/reportedUsers', async (req, res) => {
  try {
    // Find users reported three times or more
    const reportedUsers = await User.find({ ifreported: { $gte: 3 } });
    res.json(reportedUsers);
  } catch (error) {
    console.error('Error fetching reported users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to report a user
app.post('/api/reportUser/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment the isreported field by 1
    user.ifreported = (user.ifreported || 0) + 1;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'User reported successfully' });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


 

// Fetch user profile
app.get('/api/profile', async (req, res) => {
  try {
    const userId=getUserIdFromAuthentication(req)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ username: user.username, email: user.email });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/biddedProducts', async (req, res) => {
  try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // Find productIds from userbids table that match the userId
      const userBids = await Userbid.find({ userId: userId });
      const productIds = userBids.map(bid => bid.productId);

      // Find products from bids table that match the found productIds
      const biddedProducts = await Bid.find({ _id: { $in: productIds } });
      
      res.json(biddedProducts);
  } catch (error) {
      console.error('Error fetching bidded products:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// Route to fetch sold products
app.get('/api/soldProducts', async (req, res) => {
  try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      const soldProducts = await Bid.find({ userId: userId, isSold: true });
      res.json(soldProducts);
  } catch (error) {
      console.error('Error fetching sold products:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/winningBiddedProducts', async (req, res) => {
  try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // Find winning bid products from userbids table that match the userId and isWinningBid true
      const winningBids = await Userbid.find({ userId: userId, isWinningBid: true });
      const productIds = winningBids.map(bid => bid.productId);

      // Find products from bids table that match the found productIds
      const winningBiddedProducts = await Bid.find({ _id: { $in: productIds } });
      
      res.json(winningBiddedProducts);
  } catch (error) {
      console.error('Error fetching winning bidded products:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user password
app.put('/api/updatePassword', async (req, res) => {
  try {
    const userId=getUserIdFromAuthentication(req);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    console.log(req.body.password)
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if the current password is correct
app.post('/api/checkPassword', async (req, res) => {
  const {  password } = req.body;

  const userId = getUserIdFromAuthentication(req);
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    res.status(200).json({ valid: passwordMatch });
  } catch (error) {
    console.error('Error checking password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 9002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
