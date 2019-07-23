import * as path from 'path';
import * as express from 'express';
import * as helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as session from 'express-session';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Load Passport
import * as passport from 'passport';
import * as  Auth0Strategy from 'passport-auth0';

import authRouter from './routes/auth';
import userRouter from './routes/user';
import gshRouter from './routes/gsh';

// Create Express server
const app = express();

const serveSpa = (req, res, next) => {
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.sendFile(path.resolve(__dirname, '../static/index.html'));
};

// set the view engine to ejs
app.set('view engine', 'ejs');

// set some headers to help secure the app
app.use(helmet({
  hsts: false,
  frameguard: true,
  referrerPolicy: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [`'self'`],
      frameSrc: [`'none'`],
      scriptSrc: [`'self'`, `'unsafe-inline'`],
      styleSrc: [
        `'self'`,
        `'unsafe-inline'`,
        `https://cdn.auth0.com/ulp/react-components/1.0.0-beta.186/css/main.cdn.min.css`,
        `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.7.1/css/all.css`,
      ],
      imgSrc: [`'self'`, `https://user-images.githubusercontent.com`],
      fontSrc: [`'self'`, `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.7.1/webfonts/`],
      workerSrc: [`'none'`],
      connectSrc: [`'self'`],
    },
  },
}));

// parse json body
app.use(bodyParser.json());

// spa entry point
app.get('/', serveSpa);

// static assets
app.use(express.static(path.resolve(__dirname, '../static')));

// config express-session
const sess = {
  secret: process.env.COOKIE_SECRET_KEY,
  cookie: {
    maxAge: 300000,
  },
  resave: false,
  saveUninitialized: true,
  name: 'oznu-homebridge-gsh',
} as any;

if (app.get('env') === 'production') {
  sess.cookie.secure = true; // serve secure cookies, requires https
}

app.use(session(sess));

// Configure Passport to use Auth0
const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:8080/callback',
  },
  (accessToken, refreshToken, extraParams, profile, done) => {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  },
);

passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

// include routes
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/gsh', gshRouter);

// serve index.html for anything not on the /api routes
app.get(/^((?!user|auth|gsh\/).)*$/, serveSpa);

// handle errors
app.use((err, req, res, next) => {
  if (res.statusCode === 200) {
    res.status(500);
  }
  if (res.statusCode === 500) {
    console.error(err);
    return res.json({
      error: 'Internal Server Error',
      message: 'Internal Server Error',
    });
  } else {
    return res.json({
      error: err,
      message: err.message,
    });
  }
});

export default app;