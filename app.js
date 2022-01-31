'use strict';

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');

// モデル
const User = require('./models/user');
const Application = require('./models/application');
const Comment = require('./models/comment');
const Like = require('./models/like');

// User モデル
User.sync().then(() => {
  // Application モデル
  Application.belongsTo(User, { foreignKey: 'userId' });
  Application.sync().then(() => {
    // Comment モデル
    Comment.belongsTo(User, { foreignKey: 'userId' });
    Comment.belongsTo(Application, { foreignKey: 'applicationId' });
    Comment.sync();
    // Like モデル
    Like.belongsTo(User, { foreignKey: 'userId' });
    Like.belongsTo(Application, { foreignKey: 'applicationId' });
    Like.sync();
  });
});

// GitHub 認証
const GitHubStrategy = require('passport-github2').Strategy;

passport.serializeUser((user, done) => {
  done(null, user.userId);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id).then((user) => {
    done(null, user.dataValues);
  }).catch((error) => {
    done(error);
  });
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:8000/auth/github/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
      User.upsert({
        userId: profile.id,
        userName: profile.username,
        displayName: profile.displayName
      }).then((user) => {
        done(null, user[0].dataValues);
      }).catch((error) => {
        done(error);
      });
    });
  }
));

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const applicationRouter = require('./routes/applications');
const commentRouter = require('./routes/comments');

const app = express();
// app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/applications', applicationRouter);
app.use('/applications', commentRouter);

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  (req, res) => {}
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;