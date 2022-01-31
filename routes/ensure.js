'use strict';

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/auth/github')
}

module.exports = ensureAuthenticated;