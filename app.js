
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
const passport = require('koa-passport')
var app = koa();

var fs = require('co-fs');
// var Promise = require('bluebird');
// var fs = Promise.promisifyAll(require('fs'));
// "database"

var users = {}


var groups = {};
var picks = {};
var games;
var globalData = {};
app.use(passport.initialize())
app.use(passport.session())
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

    var paths = yield fs.readdir('./data');
    var files = yield paths.map(function(path){
      return {name: path.split('.json')[0], content: fs.readFile('data/' + path, 'utf8')};
    });
    yield files.map(function(content){
     globalData[content.name] = JSON.parse(content.content);
    })
    globalData.weeks = [];
    for(var i = 1;i<=17;i++ ){
      globalData.weeks.push({week:i});
    }
    
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

app.use(route.get('/', season));
app.use(route.get('/results/:week', results));
app.use(route.get('/picks/:week', picker));


app.use(route.get('/post/new', add));
app.use(route.get('/data/:id', show));
app.use(route.post('/post', create));
app.use(route.post('/data/:id', update));

// route definitions


/**
 * Post listing.
 */

function *season() {
  // console.log(globalData.groups);
  globalData.groups = globalData.groups.map(function(group){
    group.members = group.members.map(function(member){
      var temp = users[member];
      temp.total = temp.scores.reduce(function(pv, cv) {
        return pv + cv;
      }, 0);
      return temp;
    })
    return group;
  })
  yield this.render("season", globalData);
}

function *results(week) {
  if(week == 'current')week = '1';
  globalData.weeks[parseInt(week, 10)-1].current = true;
  var games = _.filter(globalData.schedule, {'week': week}).map(function(game){
    game.homewin = (game.winner == game.home);
    game.awaywin = (game.winner == game.away);
    return game;
    // return _.pick(game,['id','winner', ]);
  })
  var ids = games.map(function(game){
    return game.id;
  })
  globalData.groups = globalData.groups.map(function(group){
    group.members = group.members.map(function(member){
      var temp = users[member];
      temp.games = globalData[member].filter(function(game){
        return (ids.indexOf(game.id) >=0);
      }).map(function(game){
        game.winner = (_.find(games, {id: game.id}).winner === game.pick);
        return game;
      })
      temp.total = temp.games.reduce(function(pv, cv, index, items) {
        if(items[index].winner){
          return pv + parseInt(cv.points, 10);
        }
        return pv;
      }, 0);      
      temp.wins = temp.games.reduce(function(pv, cv, index, items) {
        if(items[index].winner){
          return pv+ 1;
        }
        return pv;
      }, 0);

      return temp;
    })
    return group;
  })
  globalData.games = games;
  yield this.render("results", globalData);
}

function *picker(week) {
  if(week == 'current')week = '1';
  globalData.weeks[parseInt(week, 10)-1].current = true;
  var games = _.filter(globalData.schedule, {'week': week}).map(function(game){
    return _.pick(game,['id','home', 'away']);
  })
  var ids = games.map(function(game){
    return game.id;
  })
  var picks = globalData['adam'].filter(function(game){
        return (ids.indexOf(game.id) >=0);
      })
  var ids = games.map(function(game){
    return game.id;
  })
  globalData.games = JSON.stringify(games);
  globalData.picks = JSON.stringify(picks);
  yield this.render("picks", globalData);
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
    // return {data: JSON.parse(fs.readFileSync(config.data_dir + '/' + id + '.json', 'utf8')), schema: JSON.parse(fs.readFileSync(config.data_dir + '/schema/' + id + '.json', 'utf8'))};
  };
}

/**
 * Show post :id.
 */

function *update(id) {

  var data = yield parse(this);
  // fs.writeFileSync(config.data_dir + '/' + id + '.json', JSON.stringify(data));
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