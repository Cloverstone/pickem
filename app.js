
/**
 * Module dependencies.
 */

// var render = require('./lib/render');
// var logger = require('koa-logger');
var route = require('koa-route');
var parse = require('co-body');
var handlebars = require("koa-handlebars");
var serve = require('koa-static-folder');
var koa = require('koa');
var _ = require('lodash');
var app = koa();

var fs = require('fs');
// "database"

var users = {}


var groups = {};
app.use(
  function *(next){
users = {
  'adam': {
    'username': 'adam',
    'scores': [92, 35, 112, 87, 79, 62, 79, 85, 53, 44, 72, 73, 95, 86, 125, 76, 99]
  },
  'chris': {
    'username': 'chris',
    'scores': [98, 50, 120, 95, 75, 59, 75, 81, 40, 33, 64, 76, 104, 89, 122, 74, 86]
  },
  'christine': {
    'username': 'christine',
    'scores': [100, 55, 123, 79, 71, 69, 79, 74, 48, 41, 67, 71, 84, 93, 129, 70, 86]
  }

}
groups = {'groups':[
  {
    'name': 'Us',
    'members':['adam', 'chris']
  },
  {
    'name': 'smallcombs',
    'members': ['adam', 'chris', 'christine']
  }
]};

  yield next;
}
)
// var config = {};
// middleware

// app.use(logger());
app.use(serve('./assets'));
app.use(handlebars({
  cache: false,
  defaultLayout: "index"
}));
// app.use(function *(next){
//   if(typeof process.argv[2] !== 'undefined') {
//     config = JSON.parse(fs.readFileSync(process.argv[2] + 'config.json', 'utf8')); 
//   }
//   yield next;
// })
// route middleware

app.use(route.get('/', list));
app.use(route.get('/post/new', add));
app.use(route.get('/data/:id', show));
app.use(route.post('/post', create));
app.use(route.post('/data/:id', update));

// route definitions


/**
 * Post listing.
 */

function *list() {
  groups.groups = groups.groups.map(function(group){
    // console.log(group.members);
    group.members = group.members.map(function(member){
      // console.log(users[member]);
      var temp = users[member];
      temp.total = temp.scores.reduce(function(pv, cv) {
        return pv + cv;
      }, 0);
      return temp;
    })
    // console.log(group);
    return group;
  })
  yield this.render("season", groups);
  // this.body = yield function *() {
    // return handlebars.render('test', {});
    // return fs.readdirSync(config.data_dir || './_site/data');
  // };
}

/**
 * Show creation form.
 */

function *add() {
  this.body = yield render('new');
}

/**
 * Show post :id.
 */

function *show(id) {

  // var post = posts[id];
  // if (!post) this.throw(404, 'invalid post id');
  // this.body = yield render('show', { post: post });

  this.body = yield function *() {
    return {data: JSON.parse(fs.readFileSync(config.data_dir + '/' + id + '.json', 'utf8')), schema: JSON.parse(fs.readFileSync(config.data_dir + '/schema/' + id + '.json', 'utf8'))};
  };
}

/**
 * Show post :id.
 */

function *update(id) {

  var data = yield parse(this);
  fs.writeFileSync(config.data_dir + '/' + id + '.json', JSON.stringify(data));
  this.body = yield function *() {
    return true;//JSON.parse(fs.readFileSync(config.data_dir + '/' + id + '.json', 'utf8'));
  };
}


/**
 * Create a post.
 */

function *create() {
  var post = yield parse(this);
  var id = posts.push(post) - 1;
  post.created_at = new Date;
  post.id = id;
  this.redirect('/');
}

// listen

app.listen(3000);
console.log('listening on port 3000');