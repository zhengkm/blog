var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, title, post) {
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

// store a paper and its info
Post.prototype.save = function(callback) {
	var date = new Date();

	// varible date type
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDay(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};

	// post that saved into db
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post,
		comments: []
	};

	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		//read collection from db
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// save post into collection
			collection.insert(post, {
				safe: true
			}, function(err) {
				mongodb.close();
				if(err) {
					return callback(err); // fail
				}
				callback(null); // success
			});
		});
	});
};

// read paper and its info
Post.getTen = function(name, page, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// read posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if (name) query.name = name;
			// read paper according given name, if no specify name, then return all papers
			collection.count(query, function(err, total) {
				collection.find(query, {
					skip: (page - 1)*10,
					limit:10
				}).sort({
					time: -1
				}).toArray(function(err, docs) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
					// parse markdown syntax to html
					docs.forEach(function(doc) {
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});
			});
		});
	});
};

Post.getOne = function(name, day, title, callback) {
	//open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// read posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// read doc according to user name, day and title 
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				// parse markdown syntax to Html
				if (doc) {
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment) {
						comment.content = markdown.toHTML(comment.content);
					});
				}
				callback(null, doc);
			});
		});
	});
};

Post.edit = function(name, day, title, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// read posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, doc); // return paper on markdown type
			});
		});
	});
};

Post.update = function(name, day, title, post, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// read posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// update post
			collection.update({
				"name": name,
				"time.day": day,
				"title": title,
			}, {
				$set: {post: post}
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

Post.remove = function(name, day, title, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			callback(err);
		}
		// read posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// delete post
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				w: 1
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
