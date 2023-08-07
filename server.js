// server.js
const express = require('express');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
require('dotenv').config();



const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); 

const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb+srv://kerrykomar:dellakomar24@cluster0.sogrgzg.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB using Mongoose
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('Connected to MongoDB successfully');
  });
  
  // Define a sample data model

  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
     
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  });

  // Hash the password before saving to the database
userSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);


  const recordSchema = new mongoose.Schema({
    name: String,
    position: String,
    level: String,
  });
 
  
  const Record = mongoose.model('Record', recordSchema);
  
  app.use(bodyParser.json());
  
  // Route to fetch all records from the database
  app.get('/records', async (req, res) => {
    try {
      const records = await Record.find();
      res.json(records);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error while fetching records' });
    }
  });
  
  // Route to add a new record to the database
  app.post('/records', async (req, res) => {
    try {
      const { name, position, level } = req.body;
      const newRecord = new Record({ name, position, level });
      await newRecord.save();
      res.json(newRecord);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error while adding a new record' });
    }
  });
  // Route to update a record in the database
  app.put('/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, position, level } = req.body;
  
      const updatedRecord = await Record.findByIdAndUpdate(
        id,
        { name, position, level },
        { new: true } // Return the updated record
      );
  
      res.json(updatedRecord);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error while updating the record' });
    }
  });
  
  // Route to delete a record from the database
  app.delete('/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRecord = await Record.findByIdAndDelete(id);
      res.json(deletedRecord);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error while deleting the record' });
    }
  });

  app.post('/register', async (req, res) => {

  
    try {
      const {name, email, password } = req.body;
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
  
      const newUser = new User({ name,email, password });
      await newUser.save();
  
      res.json({ message: 'Registration successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error while registering' });
    }
  });

  const jwt = require('jsonwebtoken');

const secretKey = 'your-secret-key'; // Replace this with a secure random string

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error while logging in' });
  }
});
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });