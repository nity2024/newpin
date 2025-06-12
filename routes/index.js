const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const userModel = require('../models/users');
const postModel = require('../models/post');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const upload = require('../multer');

passport.use(new LocalStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware to check login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  console.log('User not authenticated, redirecting to /');
  res.redirect('/');
}

// Test MongoDB connection
router.get('/test-mongo', asyncHandler(async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.send('MongoDB connection successful');
  } catch (err) {
    console.error('MongoDB ping error:', err);
    res.status(500).send(`MongoDB connection error: ${err.message}`);
  }
}));

// Routes
router.get('/', (req, res) => {
  res.render('index', { nav: false, error: null });
});

router.get('/register', (req, res) => {
  res.render('register', { nav: false, error: null });
});

router.post('/register', asyncHandler(async (req, res) => {
  try {
    const data = new userModel({
      fullname: req.body.fullname,
      username: req.body.username,
      email: req.body.email,
    });
    await userModel.register(data, req.body.password);
    passport.authenticate('local')(req, res, () => {
      console.log('User registered and logged in:', req.user.username);
      res.redirect('/profile');
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', { nav: false, error: 'Registration failed. Username or email may already exist.' });
  }
}));

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Login failed:', info);
      return res.render('index', { nav: false, error: 'Invalid username or password' });
    }
    req.logIn(user, err => {
      if (err) {
        console.error('Login session error:', err);
        return next(err);
      }
      console.log('User logged in:', user.username);
      return res.redirect('/profile');
    });
  })(req, res, next);
});

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    console.log('User logged out');
    res.redirect('/');
  });
});

router.get('/post', isLoggedIn, asyncHandler(async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('post', { user, nav: true });
}));

router.post('/creatpost', isLoggedIn, upload.single('postimage'), asyncHandler(async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!req.file) {
      return res.render('post', { user, nav: true, error: 'Please upload an image' });
    }
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });
    user.posts.push(post._id);
    await user.save();
    console.log('Post created:', post.title);
    res.redirect('/profile');
  } catch (err) {
    console.error('Post creation error:', err);
    res.render('post', { user, nav: true, error: 'Failed to create post' });
  }
}));

router.get('/profile', isLoggedIn, asyncHandler(async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts');
  res.render('profile', { user, nav: true });
}));

router.get('/edit', isLoggedIn, asyncHandler(async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('edit', { user, nav: true, error: null });
}));

router.post('/edit', isLoggedIn, upload.single('profileImage'), asyncHandler(async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    user.fullname = req.body.fullname;
    user.username = req.body.username;
    user.bio = req.body.bio;
    if (req.file) {
      console.log('Profile image uploaded:', req.file.filename);
      user.profileImage = req.file.filename;
    }
    await user.save();
    console.log('Profile updated:', user.username);
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile update error:', err);
    res.render('edit', { user, nav: true, error: 'Failed to update profile' });
  }
}));

router.get('/show/posts', isLoggedIn, asyncHandler(async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts');
  res.render('show', { user, nav: true });
}));

router.get('/feed', isLoggedIn, asyncHandler(async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate('user');
  res.render('feed', { user, posts, nav: true });
}));

// ✅ FINAL ADDITION: Profile image upload via pencil icon
router.post('/fileupload', isLoggedIn, upload.single('image'), asyncHandler(async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });

  if (!req.file) {
    console.error("No profile image uploaded.");
    return res.redirect('/profile');
  }

  user.profileImage = req.file.filename;
  await user.save();

  console.log("✅ Profile image updated:", user.profileImage);
  res.redirect('/profile');
}));

module.exports = router;
