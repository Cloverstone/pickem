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
    // var paths = yield fs.readdir('./data');
    // var files = yield paths.map(function(path){
    //   return {name: path.split('.json')[0], content: fs.readFile('data/' + path, 'utf8')};
    // });
    // yield files.map(function(content){
    //  globalData[content.name] = JSON.parse(content.content);
    // })
    globalData.weeks = [];
    for(var i = 1;i<=17;i++ ){
      globalData.weeks.push({week:i});
    }
    globalData.groups = yield this.mongo.db('pickem').collection('groups').find().toArray();

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
      yield this.mongo.db('pickem').collection('picks').save({
        user: currentUser._id, 
        game_id: globalData[user][i].id,
        pick: globalData[user][i].pick,
        points: globalData[user][i].points,
        season: year
      })
    }
  }
}
function *getTeam(team){
  if(team !== 'NY Jets' && team !== 'NY Giants'){
    team = yield this.mongo.db('pickem').collection('teams').findOne({location: team });
  }else{
    if(team == 'NY Jets'){
      team = yield this.mongo.db('pickem').collection('teams').findOne({name: 'Jets' });
    }else{
      team = yield this.mongo.db('pickem').collection('teams').findOne({name: 'Giants' });
    }
  }
    return team;
}


function *loadall(year) {
  // yield globalData;
  this.body = globalData.schedule;
  console.log(globalData.schedule.length);

  // load teams
  for(var g in globalData["2015week1"].events){
    globalData["2015week1"].events[g].competitions[0].competitors[0].team._id =globalData["2015week1"].events[g].competitions[0].competitors[0].team.id;
    globalData["2015week1"].events[g].competitions[0].competitors[1].team._id =globalData["2015week1"].events[g].competitions[0].competitors[1].team.id;
    
    yield this.mongo.db('pickem').collection('teams').save(_.pick(globalData["2015week1"].events[g].competitions[0].competitors[0].team, '_id', 'location', 'name'));
    yield this.mongo.db('pickem').collection('teams').save(_.pick(globalData["2015week1"].events[g].competitions[0].competitors[1].team, '_id', 'location', 'name'));
  }

  //load games and picks
  for(var g in globalData.schedule){
    var game = globalData.schedule[g];
    game.home = yield getTeam.call(this, game.home);
    game.home = game.home._id;
    game.away = yield getTeam.call(this,game.away);
    game.away = game.away._id;
    game.winner = yield getTeam.call(this,game.winner);
    game.winner = game.winner._id;
    game.season = year;
    yield this.mongo.db('pickem').collection('games').save(game);
    var temp = yield this.mongo.db('pickem').collection('games').findOne({id: globalData.schedule[g]['id'] });

    for(var u in users){
      var user = u;
      var currentUser = yield this.mongo.db('pickem').collection('users').findOne({username: user})

      var pick = _.find(globalData[user], {id: globalData.schedule[g]['id']});
      pick.game_id = temp._id;
      pick.user_id = currentUser._id;
      var team = yield getTeam.call(this,pick.pick);
      // if(pick.pick !== 'NY Jets' && pick.pick !== 'NY Giants'){
      //   team = yield this.mongo.db('pickem').collection('teams').findOne({location: pick.pick });
      // }else{
      //   if(pick.pick == 'NY Jets'){
      //     team = yield this.mongo.db('pickem').collection('teams').findOne({name: 'Jets' });
      //   }else{
      //     team = yield this.mongo.db('pickem').collection('teams').findOne({name: 'Giants' });
      //   }
      // }

      pick.pick = team._id;
      yield this.mongo.db('pickem').collection('picks').save(pick);
    }
  }

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
  var games = yield this.mongo.db('pickem').collection('games').find({week: week }).toArray();
  // games = _.map(games, _.bind(function(game){
  //   game.homewin = (game.winner == game.home);
  //   game.awaywin = (game.winner == game.away);
        
  //   game.home =  this.mongo.db('pickem').collection('teams').findOne({_id: game.away});
  //   game.away =  this.mongo.db('pickem').collection('teams').findOne({_id: game.home});
  //   return game;
  // }, this))
  for(var game in games){
    games[game].homewin = (games[game].winner == games[game].home);
    games[game].awaywin = (games[game].winner == games[game].away);

    games[game].home = yield this.mongo.db('pickem').collection('teams').findOne({_id: games[game].home });
    games[game].away = yield this.mongo.db('pickem').collection('teams').findOne({_id: games[game].away });
    // games[game].winner = yield this.mongo.db('pickem').collection('teams').findOne({_id: games[game].winner });


  }
  // var games = _.filter(globalData.schedule, {'week': week}).map(function(game){
  //   game.homewin = (game.winner == game.home);
  //   game.awaywin = (game.winner == game.away);
  //   return game;
  // })
  var ids = games.map(function(game){
    return game._id;
  })
  var user = this.req.user.username;
  // var games = yield this.mongo.db('pickem').collection('games').find({week: week }).toArray();

  globalData.groups = _.map(globalData.groups, _.bind(function(group){

    group.members = _.map(group.members, _.bind(function(member){
      var temp = users[member];
      console.log(week)
      temp.games = this.mongo.db('pickem').collection('games').find({username: member,week: week }).toArray();
      console.log(temp.games);
      // temp.games = _.filter(temp.games, function(game){
      //   return (ids.indexOf(game.id) >=0);
      // })

      temp.games = _.map(temp.games, function(game){
        game.winner = (_.find(games, {_id: game._id}).winner === game.pick);
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
    }, this))
    group.members = _.sortBy(group.members, function(o) { return o.total; }).reverse();
    return group;
  }, this))
  globalData.games = games;
  this.body = globalData.groups;
  // yield this.render("results", _.extend({user: this.req.user}, globalData));
}

function *picker(week) {
  if(typeof week === 'object')week = '1';
  globalData.weeks[parseInt(week, 10)-1].current = true;


  var games = yield this.mongo.db('pickem').collection('games').find({week: week }).toArray();
  for(var game in games){
    games[game].home = yield this.mongo.db('pickem').collection('teams').findOne({_id: games[game].home });
    games[game].away = yield this.mongo.db('pickem').collection('teams').findOne({_id: games[game].away });
    games[game].winner = yield this.mongo.db('pickem').collection('teams').findOne({_id: games[game].winner });

  }
  var ids = _.map(games, '_id')

  var picks = yield this.mongo.db('pickem').collection('picks').find({user_id: this.req.user._id, game_id: {$in: ids}}).toArray();
  //should remove and just let game id be right
  picks =_.map(picks, function(pick){
    return {id: pick.game_id, pick: pick.pick, points: pick.points};
  })
  // var ids = games.map(function(game){
  //   game.home = getTeam(pick.pick);

  //   // return game.id;
  // })
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



// {"user_id": "56e3a4bd1322a2ce391e8f14", "game_id": {$in: ["57a6276dd97b6b3b0345274b", "57a6276ed97b6b3b0345274f"]} }