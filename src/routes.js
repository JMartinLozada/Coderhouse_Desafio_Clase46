const express = require('express');
const passport = require('passport');
const controller = require('./controller');
const Router = require('koa-router');
//const router = express.Router();

const router = new Router();


router.get('/', controller.renderLogin);
router.post('/', controller.renderLogin);
router.get('/register', controller.renderRegister);
router.get('/logout', controller.renderLogout);
router.post('/login', controller.renderAutenticado);
router.post('/register', passport.authenticate('registracion'), controller.renderRegistrado);
router.get('/api/randoms/', controller.randomNumbers);
router.get('/info', controller.info);

module.exports = router;