/**
 * Module dependencies.
 */
const koa = require('koa');
const app = koa();
const fs = require('co-fs');
// var co = require('co')
const route = require('koa-route');
const parse = require('koa-bodyparser');
const handlebars = require("koa-handlebars");
const serve = require('koa-static-folder');
var LocalStrategy = require('passport-local').Strategy;
// var mongoose = require('koa-mongoose')
var mongo = require('koa-mongo');

// const convert = require('koa-convert') // necessary until koa-generic-session has been updated to support koa@2 
const session = require('koa-generic-session')

app.keys = ['secret']
 app.use(session({
    key: 'koapassportexample.sid',
  }));
const _ = require('lodash');
const passport = require('koa-passport')

app.use(parse());
app.use(passport.initialize())
app.use(passport.session())


app.use(mongo({
  // uri: 'mongodb://cloudberry:cberry117@ds041851.mongolab.com:41851/cloudberry', //or url
  uri: 'mongodb://cloudberry:cberry117@ds011439.mlab.com:11439/pickem',

  max: 100,
  min: 1,
  timeout: 30000,
  log: false
}));

var users = {
  'adam': {
    'username': 'adam',
    'scores': [92, 35, 112, 87, 79, 62, 79, 85, 53, 44, 72, 73, 95, 86, 125, 76, 99]
  },
  'a4hjlm': {
    'username': 'a4hjlm',
    'scores': [98, 50, 120, 95, 75, 59, 75, 81, 40, 33, 64, 76, 104, 89, 122, 74, 86]
  },
  'christine': {
    'username': 'christine',
    'scores': [100, 55, 123, 79, 71, 69, 79, 74, 48, 41, 67, 71, 84, 93, 129, 70, 86]
  }

}
var globalData = {};

passport.use(new LocalStrategy(
  function (username, password, done) {
    if(typeof users[username] === 'undefined'){
      return done(null, false, { message: 'Incorrect username.' });
    }
    return done(null, {id: username})
    // User.findOne({ username: username }, function(err, user) {
    //     if (err) { return done(err); }

    //     if (!user) {
    //         return done(null, false, { message: 'Incorrect username.' });
    //     }
    //     // if (!user.validPassword(password)) {
    //     //   return done(null, false, { message: 'Incorrect password.' });
    //     // }
    //     return done(null, user);
    // });
  }
));
passport.serializeUser(function(user, done) { 
  // console.log('serialized: ' + user.id)
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {  
          done(null, {id: id});
    // User.findById(id, function(err, user) {
    //     done(err, user);
    // });
});

app.use(
  function *(next){
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
// middleware

app.use(serve('./assets'));
app.use(handlebars({
  cache: false,
  defaultLayout: "index"
}));

app.use(function*(next) {
  if(this.req.url !== '/login'){
    if (this.isAuthenticated()) {

      // console.log(yield this.mongo.db('cloudberry').collection('users').findOne({username: this.req.user.id}));

      yield next
    } else {
      this.redirect('/login')
    }
  }else{yield next;}
})

app.use(route.get('/', season));
app.use(route.get('/results/:week', results));
app.use(route.get('/results/', results));
app.use(route.get('/picks/:week', picker));
app.use(route.get('/picks/', picker));

app.use(route.get('/login', showLogin));
app.use(route.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  })) );
app.use(route.get('/logout', logout));

function *season() {
  globalData.groups = globalData.groups.map(function(group){
    group.members = group.members.map(function(member){
      // console.log(member);
      var temp = users[member];
      temp.total = temp.scores.reduce(function(pv, cv) {
        return pv + cv;
      }, 0);
      return temp;
    })
    return group;
  })
  yield this.render("season", _.extend({user: this.req.user}, globalData));
}

function *results(week) {
  if(typeof week === 'object')week = '1';
  globalData.weeks[parseInt(week, 10)-1].current = true;
  var games = _.filter(globalData.schedule, {'week': week}).map(function(game){
    game.homewin = (game.winner == game.home);
    game.awaywin = (game.winner == game.away);
    return game;
  })
  var ids = games.map(function(game){
    return game.id;
  })
  var user = this.req.user.id;
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
      if(user == member){
        temp.current = true;
      }
      temp.wins = temp.games.reduce(function(pv, cv, index, items) {
        if(items[index].winner){
          return pv+ 1;
        }
        return pv;
      }, 0);

      return temp;
    })
    group.members = _.sortBy(group.members, function(o) { return o.total; }).reverse();
    return group;
  })
  globalData.games = games;
  yield this.render("results", _.extend({user: this.req.user}, globalData));
}

function *picker(week) {
  if(typeof week === 'object')week = '1';
  globalData.weeks[parseInt(week, 10)-1].current = true;
  var games = _.filter(globalData.schedule, {'week': week}).map(function(game){
    return _.pick(game,['id','home', 'away']);
  })
  var ids = games.map(function(game){
    return game.id;
  })
  var picks = globalData[this.req.user.id].filter(function(game){
        return (ids.indexOf(game.id) >=0);
      })
  var ids = games.map(function(game){
    return game.id;
  })
  globalData.games = JSON.stringify(games);
  globalData.picks = JSON.stringify(picks);
  yield this.render("picks", _.extend({user: this.req.user}, globalData));
}

function *showLogin(week) {
  yield this.render("login", globalData);
}

function *logout(week) {
  this.logout();
  this.redirect('/login');
}

// listen

app.listen(3000);
console.log('listening on port 3000');