var mongodb = require('./db');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;

};

module.exports = User;

// store user information
User.prototype.save = function(callback) {
	// save user info to db
	var user = {
		name: this.name,
		password: this.password,
		email: this.email
	};

	//open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// read users collection
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// save user info into users collection
			collection.insert(user, {
				safe: true
			}, function(err, user) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, user[0]); // success! return user info after save
			});
		});
	});
};

// read user info
User.get = function(name, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// read users collection
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// find a document whose name is xxx
			collection.findOne({
				name: name
			}, function(err, user) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, user); // success! return user info
			});
		});
	});
};
