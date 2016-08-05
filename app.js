/**
 * Module dependencies.
 */
const koa = require('koa');
const app = koa();
const fs = require('co-fs');
var co = require('co')
const route = require('koa-route');
const parse = require('koa-bodyparser');
const handlebars = require("koa-handlebars");
const serve = require('koa-static-folder');
const bcrypt = require('co-bcrypt');
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

app.use(serve('./assets'));
app.use(parse());
app.use(passport.initialize())
app.use(passport.session())


var user = function(){
  comparePassword = function *(candidatePassword, user) {  
    return yield bcrypt.compare(candidatePassword, user.password);
  };

  matchUser = function *(username, password) { 
    var user = yield this.mongo.db('pickem').collection('users').findOne({username: username});
    if (!user) throw new Error('User not found');

    if (yield comparePassword(password, user))
      return user;

    throw new Error('Password does not match');
  };
  getUser = function *(_id) {
    return yield this.mongo.db('pickem').collection('users').findOne({username: _id});
  }
  return {
    comparePassword: comparePassword.bind(this),
    matchUser: matchUser.bind(this),
    getUser: getUser.bind(this)
  }
}

app.use(
  mongo({
    // uri: 'mongodb://cloudberry:cberry117@ds041851.mongolab.com:41851/cloudberry', //or url
    uri: 'mongodb://pickem:pickem117@ds011439.mlab.com:11439/pickem',
    max: 100,
    min: 1,
    timeout: 30000,
    log: false
  })
);
var myUser;
app.use(function *(next){
  myUser = user.call(this);
  yield next;
})

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
var teams =['Arizona', 'Atlanta', 'Baltimore', 'Buffalo', 'Carolina', 'Chicago', 'Cincinnati', 'Cleveland', 'Dallas', 'Denver', 'Detroit', 'Green Bay', 'Houston', 'Indianapolis', 'Jacksonville', 'Kansas City', 'Miami', 'Minnesota', 'New England', 'New Orleans', 'NY Giants', 'NY Jets', 'Oakland', 'Philadelphia', 'Pittsburgh', 'San Diego', 'San Francisco', 'Seattle', 'St. Louis', 'Tampa Bay', 'Tennessee', 'Washington'];
var globalData = {};

app.use(handlebars({
  cache: false,
  defaultLayout: "index"
}));


function AuthLocalUser(username, password, done) {
   co(function *(next) {
    try {
      return yield myUser.matchUser(username, password);
    } catch (ex) {    
      console.log(ex)
      return null;
    }
  }).then(function(user){
    done(null, user);
  });
};
passport.use(new LocalStrategy(AuthLocalUser.bind(this)));

passport.serializeUser(function(user, done) { 
    done(null, user.username);
});

passport.deserializeUser(function (id, done) {  
  co(function *(){
    var user = yield myUser.getUser(id, done);
    done(null, user);
  })
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


app.use(function *(next) {
  if(this.req.url !== '/login'){
    if (this.isAuthenticated()) {
      // var salt = yield bcrypt.genSalt(10)
      // var hash = yield bcrypt.hash('chmasa21', salt)
      // var result = yield this.mongo.db('pickem').collection('users').save({username: 'adam', password: hash})


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
// app.use(route.post('/picks/:week', picker_save));
app.use(route.get('/picks/', picker));


app.use(route.get('/load/:year', loadUser));
app.use(route.get('/loadall/:year', loadall));


app.use(route.get('/login', showLogin));
app.use(route.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  })) );
app.use(route.get('/logout', logout));

function *loadUser(year) {
  for(var u in users){
    var user = users[u];
    var currentUser = yield this.mongo.db('pickem').collection('users').findOne({username: user})
    for(var i in globalData[user]){
      yield this.mongo.db('pickem').collection('pickems').save({
        user: currentUser._id, 
        game_id: globalData[user][i].id,
        pick: globalData[user][i].pick,
        points: globalData[user][i].points,
        season: year
      })
    }
  }
}
function *loadall(year) {
  // yield globalData;
  this.body = globalData;
  for(var g in globalData.schedule){

  //   console.log(globalData.schedule[g].home);
  // }
  console.log(_.pick(globalData.schedule[0], 'home', 'away'));
  // for(var u in users){
  //   var user = users[u];
  //   var currentUser = yield this.mongo.db('pickem').collection('users').findOne({username: user})
  //   for(var i in globalData[user]){
  //     yield this.mongo.db('pickem').collection('pickems').save({
  //       user: currentUser._id, 
  //       game_id: globalData[user][i].id,
  //       pick: globalData[user][i].pick,
  //       points: globalData[user][i].points,
  //       season: year
  //     })
  //   }
  // }



}

function *season() {

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
  var user = this.req.user.username;
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

  var picks = yield this.mongo.db('pickem').collection('pickems').find({user: this.req.user._id, game_id: {$in: ids} }).toArray();

  picks =_.map(picks, function(pick){
    return {id: pick.game_id, pick: pick.pick, points: pick.points};
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