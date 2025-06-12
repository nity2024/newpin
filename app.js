require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const createError = require('http-errors');

const indexRouter = require('./routes/index');

const app = express();

// ✅ Trust Render's proxy
app.set('trust proxy', 1);

// Optional: Debug logs
if (process.env.DEBUG === 'true') {
  mongoose.set('debug', true);
}

// ✅ Mongoose connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  ssl: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Session + Mongo store with secure cookie settings
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', indexRouter);

// 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔥 Error:', err);
  }
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
