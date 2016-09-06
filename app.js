/**
 * Module dependencies.
 */
const koa = require('koa');
const app = koa();
const fs = require('co-fs');
var co = require('co')
const route = require('koa-route');
const parse = require('koa-bodyparser');
const cookie = require('cookie')
const handlebars = require("koa-handlebars");
const serve = require('koa-static-folder');
const bcrypt = require('co-bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var ObjectId = require('mongodb').ObjectID;
// var mongoose = require('koa-mongoose')
const mongo = require('koa-mongo');

var req = require('request');
const IO = require( 'koa-socket' )
const moment = require( 'moment' )


const io = new IO()

// const convert = require('koa-convert') // necessary until koa-generic-session has been updated to support koa@2 
// const session = require('koa-generic-session')
// const MongoStore = require('connect-mongo')(session);
const session = require('koa-session-store');
const mongoStore = require('koa-session-mongo');


app.keys = ['secret']
 // app.use(session({
 //    key: 'koapassportexample.sid',
 //  }));


app.use(session({
  store: mongoStore.create({
    // db: 'pickem',
    url: 'mongodb://pickem:pickem117@ds011439.mlab.com:11439/pickem',

    key: 'koapassportexample.sid'
  })
}));

const _ = require('lodash');
const passport = require('koa-passport')

app.use(serve('./assets'));
app.use(parse());
app.use(passport.initialize())
app.use(passport.session())


var user = function(){
  comparePassword = function *(candidatePassword, user) {  

    var value = false;
    if(user.password == ''){
      value = true;
    }else{
      value = yield bcrypt.compare(candidatePassword, user.password);
    }        

    return value;
  };

  matchUser = function *(username, password) { 
    var user = yield this.mongo.db('pickem').collection('users').findOne({username: username});
    if (!user) throw new Error('User not found');

    if (yield comparePassword(password, user))
      return user;

    throw new Error('Password does not match');
  };
  getUser = function *(username) {
    return yield this.mongo.db('pickem').collection('users').findOne({username: username});
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
var myMongo;
app.use(function *(next){
  myUser = user.call(this);
  myMongo = this.mongo;
  yield next;
})

// var users = {
//   'adam': {
//     'username': 'adam'
//     // 'scores': [92, 35, 112, 87, 79, 62, 79, 85, 53, 44, 72, 73, 95, 86, 125, 76, 99]
//   },
//   'a4hjlm': {
//     'username': 'a4hjlm'
//     // 'scores': [98, 50, 120, 95, 75, 59, 75, 81, 40, 33, 64, 76, 104, 89, 122, 74, 86]
//   },
//   'christine': {
//     'username': 'christine'
//     // 'scores': [100, 55, 123, 79, 71, 69, 79, 74, 48, 41, 67, 71, 84, 93, 129, 70, 86]
//   }

// }
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

app.use(function *(next) {
  if(this.req.url !== '/login'){
    if (this.isAuthenticated()) {
      yield next
    } else {
      this.redirect('/login')
    }
  }else{yield next;}
})

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
    for(var i = 1;i<17;i++ ){
      globalData.weeks.push({week:i});
    }
    //globalData.groups = yield this.mongo.db('pickem').collection('groups').find().toArray();
      if(typeof this.req.user !== 'undefined'){
    globalData.groups = yield myMongo.db('pickem').collection('groups').find({members: ObjectId(this.req.user._id)}).toArray();
}
    teams =  yield this.mongo.db('pickem').collection('teams').find().toArray();
    yield next;
  }
)
// middleware



app.use(route.get('/', season));
app.use(route.get('/results/:week', results));
app.use(route.get('/results/', results));
app.use(route.get('/picks/:week', picker));
app.use(route.post('/picks/:week', pickem));
app.use(route.get('/picks/', picker));


app.use(route.get('/load/:year', loadUser));
app.use(route.get('/loadall/:year', newLoadall));
app.use(route.get('/account', account));
app.use(route.post('/account', accountUpdate));
app.use(route.post('/password', passwordUpdate));
app.use(route.get('/test', test));



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
function *teamFromID(_id){

  return _.find(teams , {_id :_id});
      // return yield this.mongo.db('pickem').collection('teams').findOne({_id: _id });
}


function *getUser(name){

  // return _.find(teams , {_id :_id});
      // return yield this.mongo.db('pickem').collection('teams').findOne({_id: _id });
}


function *newLoadall(year) {
  // yield globalData;
  // this.body = globalData.schedule;
  // console.log(globalData.schedule.length);

  // load teams
 // globalData["2016week1"] = JSON.parse(yield fs.readFile('old_data/original/' + year + 'week1.json', 'utf8'));
 //  for(var g in globalData["2016week1"].events){
 //    globalData["2016week1"].events[g].competitions[0].competitors[0].team._id =globalData["2016week1"].events[g].competitions[0].competitors[0].team.id;
 //    globalData["2016week1"].events[g].competitions[0].competitors[1].team._id =globalData["2016week1"].events[g].competitions[0].competitors[1].team.id;
    
 //    yield this.mongo.db('pickem').collection('teams').save(_.pick(globalData["2016week1"].events[g].competitions[0].competitors[0].team, '_id', 'location', 'name', 'abbreviation'));
 //    yield this.mongo.db('pickem').collection('teams').save(_.pick(globalData["2016week1"].events[g].competitions[0].competitors[1].team, '_id', 'location', 'name', 'abbreviation'));
 //  }
  
this.body = "Here";
// console.log(year);
  for(var i=1;i<=16;i++){
    // console.log('old_data/original/'+year+'week'+i+'.json');
   var weekData = JSON.parse(yield fs.readFile('old_data/original/' + year + 'week' + i + '.json', 'utf8'));
   var week = {'week': i, 'season': year, 'games': []};
    for(var g in weekData.events) {
      var game = {'index': g};
      var temp = weekData.events[g].competitions[0];
      game[temp.competitors[0].homeAway] = temp.competitors[0].team.id;
      game[temp.competitors[1].homeAway] = temp.competitors[1].team.id;
      // if(temp.competitors[0].winner){
      //   game.winner = temp.competitors[0].team.id;
      // }else if(temp.competitors[1].winner){
      //   game.winner = temp.competitors[1].team.id;
      // }else{
      //   game.winner = "";
      // }
      week.games.push(game);
    }
    yield this.mongo.db('pickem').collection('weeks').save(week);

    // console.log(week);
  }
  // console.log(schedule);
// var week = {}
//   //load games and picks
//   for(var g in globalData.schedule){
//     var game = globalData.schedule[g];
//     game.home = yield getTeam.call(this, game.home);
//     game.home = game.home._id;
//     game.away = yield getTeam.call(this,game.away);
//     game.away = game.away._id;
//     game.winner = yield getTeam.call(this,game.winner);
//     game.winner = game.winner._id;
//     game.season = year;

//   }
//     yield this.mongo.db('pickem').collection('games').save(game);
    
//     var temp = yield this.mongo.db('pickem').collection('games').findOne({id: globalData.schedule[g]['id'] });

//     for(var u in users){
//       var user = u;
//       var currentUser = yield this.mongo.db('pickem').collection('users').findOne({username: user})

//       var pick = _.find(globalData[user], {id: globalData.schedule[g]['id']});
//       pick.game_id = temp._id;
//       pick.user_id = currentUser._id;
//       var team = yield getTeam.call(this,pick.pick);
//       // if(pick.pick !== 'NY Jets' && pick.pick !== 'NY Giants'){
//       //   team = yield this.mongo.db('pickem').collection('teams').findOne({location: pick.pick });
//       // }else{
//       //   if(pick.pick == 'NY Jets'){
//       //     team = yield this.mongo.db('pickem').collection('teams').findOne({name: 'Jets' });
//       //   }else{
//       //     team = yield this.mongo.db('pickem').collection('teams').findOne({name: 'Giants' });
//       //   }
//       // }

//       pick.pick = team._id;
//       yield this.mongo.db('pickem').collection('picks').save(pick);
//     }


}


function *loadall(year) {
  // yield globalData;
  this.body = globalData.schedule;
  console.log(globalData.schedule.length);

  // load teams
  for(var g in globalData["2016week1"].events){
    globalData["2016week1"].events[g].competitions[0].competitors[0].team._id =globalData["2016week1"].events[g].competitions[0].competitors[0].team.id;
    globalData["2016week1"].events[g].competitions[0].competitors[1].team._id =globalData["2016week1"].events[g].competitions[0].competitors[1].team.id;
    
    yield this.mongo.db('pickem').collection('teams').save(_.pick(globalData["2016week1"].events[g].competitions[0].competitors[0].team, '_id', 'location', 'name', 'abbreviation'));
    yield this.mongo.db('pickem').collection('teams').save(_.pick(globalData["2016week1"].events[g].competitions[0].competitors[1].team, '_id', 'location', 'name', 'abbreviation'));
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


/*Route Handlers*/
function *season() {
  if(typeof this.req.user !== 'undefined' && this.req.user.password == '') {
    this.redirect('/account');
  }
  var userReuse = {};

  var userReuse = {};
  for(var g in globalData.groups){
    group = globalData.groups[g];
    for(var m in group.members){
      member = group.members[m];

      if(typeof userReuse[member] == 'undefined'){
        userReuse[member] = yield this.mongo.db('pickem').collection('users').findOne({_id: member });
        userReuse[member].scores = [];

        for(var i = 1;i<=16;i++){
          var hello = yield this.mongo.db('pickem').collection('picks').findOne({week: i+'', season: '2016', user:userReuse[member]._id});
          if(hello !== null){
            userReuse[member].scores.push({week: i, score: hello.total, wins: hello.wins});
          }else{
            userReuse[member].scores.push({week: i, score: '', wins: ''});
          }
        }
      }
      group.members[m] = userReuse[member];
    }

    group.members = _.sortBy(group.members, function(o) { return o.total; }).reverse();
    globalData.groups[g] = group;
  }
  yield this.render("season", _.extend({user: this.req.user}, globalData));

}

function *results(week) {
  if(typeof week === 'object')week = currentWeek();
  globalData.weeks[parseInt(week, 10)-1].current = true;


  var thisweek =  yield this.mongo.db('pickem').collection('weeks').findOne({week: parseInt(week), season: '2016'});
  var games = {};
  if(thisweek !== null){
    games = thisweek.games;
  }

  for(var game in games){
    games[game].homewin = (games[game].winner == games[game].home);
    games[game].awaywin = (games[game].winner == games[game].away);
    games[game].home = yield teamFromID.call(this,games[game].home);
    games[game].away = yield teamFromID.call(this,games[game].away);
  }
  globalData.source = games;

  var user = this.req.user.username;
  var userReuse = {};
  for(var g in globalData.groups){
    group = globalData.groups[g];
    for(var m in group.members){
      member = group.members[m];

      if(typeof userReuse[member] == 'undefined'){
        userReuse[member] = yield this.mongo.db('pickem').collection('users').findOne({_id: member });

        var mygames =  yield this.mongo.db('pickem').collection('picks').findOne({week: week, season: '2016', user:userReuse[member]._id});
        if(mygames !== null){
          userReuse[member].games = mygames.picks;
          userReuse[member].total = mygames.total;
          userReuse[member].wins = mygames.wins;
          userReuse[member].current = (user == member);

          for(var game in mygames.picks){
            if(typeof mygames.picks[game].pick !== 'undefined'){
              mygames.picks[game].pick = yield teamFromID.call(this,mygames.picks[game].pick);
              mygames.picks[game].winner = (_.find(games, {index: game}).winner === mygames.picks[game].pick._id);
            }
          }      
        }
      }
      group.members[m] = userReuse[member];
    }
    group.members = _.sortBy(group.members, function(o) { return o.total; }).reverse();
    globalData.groups[g] = group;
  }

  globalData.games = games;
  yield this.render("results", _.extend({user: this.req.user}, globalData));
}




function *picker(week) {
  if(typeof week === 'object')week = currentWeek();
  globalData.weeks[parseInt(week, 10)-1].current = true;

  var mygames = yield this.mongo.db('pickem').collection('weeks').findOne({week: parseInt(week, 10), season: '2016' });
  var games = mygames.games;
  for(var game in games){
    games[game].home = yield teamFromID.call(this,games[game].home);
    games[game].away = yield teamFromID.call(this,games[game].away);
    games[game].winner = yield teamFromID.call(this,games[game].winner);
  }

  var pickems =  yield this.mongo.db('pickem').collection('picks').findOne({week: week, season: '2016', user: this.req.user._id });
  var picks = [];
  if(pickems !== null){
    picks = pickems.picks;
  }
  picks =_.map(picks, function(pick, i){
    return {id: i, pick: pick.pick, points: pick.points};
  })

  globalData.games = JSON.stringify(games);
  globalData.picks = JSON.stringify(picks);
  globalData.limited = !_.reject(globalData.groups, function(item){return item.limited}).length;//JSON.stringify(globalData.groups);
  globalData.week = week;
  yield this.render("picks", _.extend({user: this.req.user}, globalData));
}

function *pickem(week){
  this.body = this.request.body;
  var changed = this.request.body.changed;
  var item = {picks: changed, user: this.req.user._id, week: week, season: '2016'}

  var old =  yield this.mongo.db('pickem').collection('picks').findOne({week: week, season: '2016', user: this.req.user._id });
  if(old !== null){
      item._id = old._id;
  }
  this.mongo.db('pickem').collection('picks').save(item);
}




function *account(){
  globalData.userdata = JSON.stringify(_.omit(this.req.user, '_id', 'password') );
  yield this.render("account", _.extend({user: this.req.user}, globalData));
}


function *accountUpdate(){

  // var newUser = this.request.body.user;
  // newUser._id = this.req.user._id;
  // console.log
  this.req.user.username = this.request.body.user.username;
  this.req.user.email = this.request.body.user.email;
  this.req.user.color = this.request.body.user.color;
  this.mongo.db('pickem').collection('users').save(this.req.user);
  this.body = {error:false} ;


}
function *passwordUpdate(){
    var salt = yield bcrypt.genSalt(10)
    this.req.user.password = yield bcrypt.hash(this.request.body.new_password, salt)
    this.mongo.db('pickem').collection('users').save(this.req.user);
    this.body = {error:false} ;

}

function *test(){
  var week = currentWeek();
  var year = '2016';
  var weekData = JSON.parse(yield fs.readFile('old_data/original/' + year + 'week' + week + '.json', 'utf8'));
  var games = [];

  var mygames = yield this.mongo.db('pickem').collection('weeks').findOne({week: parseInt(week, 10), season: '2016' });

  for(var g in weekData.events) {
    var winner = "";
    var temp = weekData.events[g].competitions[0];

    if(temp.competitors[0].winner){
      winner = temp.competitors[0].team.id;
    }else if(temp.competitors[1].winner){
      winner = temp.competitors[1].team.id;
    }
    mygames.games[g].winner = winner;
    games.push(winner);
  }

  this.mongo.db('pickem').collection('weeks').save(mygames);

  var picks = yield this.mongo.db('pickem').collection('picks').find({week: week, season: year}).toArray();
  for(var p in picks){
    picks[p].total = 0;
    picks[p].wins = 0;
    for(var g in games) {
      if(
        games[g] !== '' && 
        typeof picks[p].picks[g] !== 'undefined' && 
        parseInt(games[g],10) == parseInt(picks[p].picks[g].pick,10) &&
        typeof picks[p].picks[g].points !== 'undefined'
      ){
        picks[p].total += parseInt(picks[p].picks[g].points, 10);
        picks[p].wins++;
      }
    }
    yield this.mongo.db('pickem').collection('picks').save(picks[p]);
  }
}

function *showLogin(week) {
  yield this.render("login", globalData);
}

function *logout(week) {
  this.logout();
  this.redirect('/login');
}
io.attach( app )


// io.on('connection', function(ctx){
//   console.log('----- a user connected');
//   var session_cookie = cookie.parse(ctx.socket.handshake.headers.cookie)['koa:sess'];
//   if(typeof session_cookie !== 'undefined'){
//     var session_id = JSON.parse(session_cookie);
    
//     var mysession = getsession(session_id._sid);
//     console.log(mysession);
//   }


//    var room = 120;
//   ctx.socket.on('join',  function(data){
//       this.socket.join(room);
//   }.bind(ctx));
//   ctx.socket.on('disconnect', function() {
//     ctx.socket.leave(room)
//     console.log('user disconnected');
//   }.bind(ctx));

// });

io.on('connection', ( ctx, data ) => {
  console.log('----- a user connected');
  if(typeof ctx.socket.handshake.headers.cookie !== 'undefined'){
      var session_cookie = cookie.parse(ctx.socket.handshake.headers.cookie)['koa:sess'];
    if(typeof session_cookie !== 'undefined'){
      var session_id = JSON.parse(session_cookie);
      // console.log(session_id._sid);
      co(function*(){
        var mysession = yield myMongo.db('pickem').collection('sessions').findOne({_id: session_id._sid});
        // console.log(JSON.parse(mysession.blob).passport.user);
        var user = yield myMongo.db('pickem').collection('users').findOne({username: JSON.parse(mysession.blob).passport.user});
        var groups = yield myMongo.db('pickem').collection('groups').find({members: ObjectId(user._id)}).toArray();
        
        // console.log(_.map(groups, 'name') );
        var myGroups = _.map(groups, 'name');
        for(var i in myGroups) {
          console.log('Joining: '+myGroups[i])
          ctx.socket.join(myGroups[i]);
        }

      })
    }
  }

  // var room = 120;
  // ctx.socket.on('join',  function(data){
  //     this.socket.join(room);
  // }.bind(ctx));

  ctx.socket.on('disconnect', function(ctx) {
    // this.socket.leave(room)

    console.log('user disconnected');
    co(function*(){
      var mysession = yield myMongo.db('pickem').collection('sessions').findOne({_id: session_id._sid});
      // console.log(JSON.parse(mysession.blob).passport.user);
      var user = yield myMongo.db('pickem').collection('users').findOne({username: JSON.parse(mysession.blob).passport.user});
      var groups = yield myMongo.db('pickem').collection('groups').find({members: ObjectId(user._id)}).toArray();
      
      // console.log(_.map(groups, 'name') );
      var myGroups = _.map(groups, 'name');
      for(var i in myGroups) {
        console.log('Leaving: '+myGroups[i])
        ctx.socket.leave(myGroups[i]);
      }

    })


    // this.sockets.manager.roomClients[socket.id] 
    // this.socket.leave
  });

})


io.on('message', function(msg){

      var session_cookie = cookie.parse(msg.socket.socket.handshake.headers.cookie)['koa:sess'];
    if(typeof session_cookie !== 'undefined'){
      var session_id = JSON.parse(session_cookie);
      co(function*(){
        var mysession = yield myMongo.db('pickem').collection('sessions').findOne({_id: session_id._sid});
        // console.log(JSON.parse(mysession.blob).passport.user);
        var user = yield myMongo.db('pickem').collection('users').findOne({username: JSON.parse(mysession.blob).passport.user});
        io.socket.to(msg.data.group).emit('message', {"group":msg.data.group, "content":msg.data.content, "user": user});

      })
    }

  // io.socket.to(msg.data.group).emit('message', {"content":msg.data.content});
});
// listen

function currentWeek(){
  return (moment().add(-2, 'days').week() - 36 || 1) +'';
}
// console.log(currentWeek());
app.listen(process.env.PORT || 3000);
console.log('listening on port'+(process.env.PORT || 3000));

//http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?calendartype=blacklist&limit=100&dates=2016&seasontype=2&week=2