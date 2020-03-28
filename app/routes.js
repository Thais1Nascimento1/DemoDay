module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('landing.ejs');
    });

    app.get('/index', function(req, res) {
        res.render('index.ejs');
    });



    // landlord SECTION =========================
    app.get('/landlord', isLoggedIn, function(req, res) {
//need to figure out how to also get reviews collections
//also need to figure out how to get landlord name here to search for
        db.collection('landlords').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('index.ejs', {
            user : req.user,
            messages: result
          })
        })
    });

//need to figure out how to search for landlords on index.ejs

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

//here we add a new landlord from index.ejs
    app.post('/newLandlord', (req, res) => {
      db.collection('landlords').save({name: req.body.name, reviews: [], properties: [],rating:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved landlord')
        res.redirect('/landlord')
      })
    })

//this .put has to happen on index.ejs and landord.ejs
    app.put('/newReview', (req, res) => {
//the big issue here I have to figure out how to do a .post and a .put at the same time. I need to create a new review in the reviews collection and then add that reviews id to the reviews property on the right landlord.
      db.collection('landlord')
      .findOneAndUpdate({name: req.body.name}, {
        $push: {
          reviews:req.body.review
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.put('/thumbDown', (req, res) => {
  console.log(req.body)
  db.collection('messages')
  .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    $set: {
      thumbUp:req.body.thumbUp - 1
    }
  }, {
    sort: {_id: -1},
    upsert: true
  }, (err, result) => {
    if (err) return res.send(err)
    res.send(result)
  })
})

    app.delete('/messages', (req, res) => {
      db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/index', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/index', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/index');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
