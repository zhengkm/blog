var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

module.exports = function(app) {
  	app.get('/', function (req, res) {
        // check whether it is the first page
        var page = req.query.p ? parseInt(req.query.p) : 1;
        // return 10 papers from the kth page
        Post.getTen(null, page, function(err, posts, total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: 'HomePage',
                posts: posts,
                page: page,
                isFirstPage: (page-1) == 0,
                isLastPage: ((page-1)*10 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    // handle register request
    app.get('/reg', checkNotLogin);
  	app.get('/reg', function (req, res) {
        console.log("ppppppppppppppppppppp");
      	res.render('reg', { 
          title: 'Register',
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
    });
    
    app.post('/reg', checkNotLogin);	
  	app.post('/reg', function (req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];

        // valid password
        if (password_re != password) {
            req.flash('error', 'two passwords are not identical');
            return res.redirect('/reg'); // redirect to '/reg'
        }

        //product an md5 value
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });

        // check whether user name exist
        User.get(newUser.name, function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            if (user) {
                req.flash('error', 'user name exists!');
                return res.redirect('/reg');
            }
            // create new user into db
            newUser.save(function(err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user; // save user info to session
                req.flash('success', 'register success!');
                res.redirect('/');
            });
        });
  	});
  	
    // handle login request
    app.get('/login', checkNotLogin);
  	app.get('/login', function (req, res) {
  		  res.render('login', { 
            title: 'Login',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString() 
        });
  	});
  	
    app.post('/login', checkNotLogin);
  	app.post('/login', function (req, res) {
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');

        User.get(req.body.name, function(err, user) {
            if (!user) {
                req.flash('error', 'user not exist!');
                return res.redirect('/login');
            }
            if (user.password != password) {
                req.flash('error', 'password is wrong!');
                return res.redirect('/login');
            }

            req.session.user = user;
            req.flash('success', 'login success!');
            res.redirect('/');
        });
  	});
  	
    // handle post request
    app.get('/post', checkLogin);
  	app.get('/post', function (req, res) {
    	 res.render('post', { 
            title: 'Post',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString() 
        });
  	});
  	
    app.post('/post', checkLogin);
  	app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'post!');
            res.redirect('/');
        });
  	});
  	
    // handle logout request
    app.get('/logout', checkLogin);
  	app.get('/logout', function (req, res) {
        req.session.user = null,
        req.flash('success', 'logout!');
        res.redirect('/');
  	});

    // handle upload request
    app.get('/upload', checkLogin);
    app.get('/upload', function(req, res) {
        res.render('upload', {
            title: 'upload file',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', function(req, res) {
        req.flash('success', 'upload!');
        res.redirect('/upload');
    });

    // handle user page request
    // app.get('/u/*', checkLogin);
    app.get('/u/:name', function(req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        // check user
        User.get(req.params.name, function(err, user) {
            if (!user) {
                req.flash('error', 'No this user!');
                return res.redirect('/');
            }
            // find and return 10 papers by user name and kth page
            Post.getTen(user.name, page, function(err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page-1) == 0,
                    isLastPage: ((page-1)*10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    app.get('/u/:name/:day/:title', function(req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    // comment
    app.post('/u/:name/:day/:title', function(req, res) {
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " +
                   date.getHours() + ":" + (date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes());
        
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };

        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', 'commentde!');
            res.redirect('back');
        });
    });

    // handle edit and delete request
    app.get('/edit/*', checkLogin);
    app.get('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('errror', err);
                return res.render('back');
            }
            res.render('edit', {
                title: 'edit',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.post('/edit/*', checkLogin);
    app.post('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect(url); // fail, back to home page
            }
            req.flash('success', 'Save!');
            res.redirect(url); // success
        });
    });

    // handle delete request
    app.get('/remove/*', checkLogin);
    app.get('/remove/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', 'Remove!');
            res.redirect('/');
        });
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', 'not login!');
            res.redirect('/login'); 
        }
        else {
            next();
        }
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', 'already login!');
            res.redirect('back'); // return back to pre page
        }
        else {
            next();
        }
    }
};