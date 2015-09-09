var showtimes = require('showtimes');

var toArray = function (obj) {
  var arr = [];
  for (var k in obj) {
    arr.push(obj[k]);
  }
  return arr;
};


var handler = function(data, ferd) {

  var send = function (message, attachment) {
    var params = {
      channel: data.channel,
      as_user: false,
      username: 'Ferd',
      icon_emoji: ':movie_camera:',
      mrkdwn: true
    };
    if (message) {
      params.text = message;
    }
    if (attachment) {
      params.attachments = JSON.stringify([attachment]);
    }
    return ferd.sendMessage(params);
  };

  var help = function () {
    var message = "Usage: `ferd flix` _`<post code or address>`_";
    send(message);
  };

  var style = function (movies) {

    var attachments = [];
    movies.forEach(function (movie) {

      var times = movie.showing.reduce(function (memo, cinema) {
        var line = cinema.theater + '\n' +
                   cinema.showtimes.join(', ');
        return memo.concat(line);
      }, []);
      var attachment = {
        author_name: movie.name,
        author_link: movie.trailer || movie.imdb,
        text: times.join('\n'),
        mrkdwn_in: ["text"]
      };
      if (movie.trailer) {
        var YoutubeId = movie.trailer.match(/(?:v=)(.+)$/)[1];
        if (YoutubeId) {
          attachment.thumb_url = "http://img.youtube.com/vi/" + YoutubeId + "/0.jpg";
        }
      }
      attachments.push(attachment);

    });
    return attachments;

  };

  var transform = function (theaters) {
    var movies = {};
    theaters.forEach(function (theater) {
      theater.movies.forEach(function (movie) {
        if (!movies[movie.id]) {
          movies[movie.id] = movie;
          movies[movie.id].showing = [];
        } 
        var at = { 
          theater: theater.name,
          showtimes: movie.showtimes.map(function (time) {
            return '`' + time + '`';
          }) 
        };
        movies[movie.id].showing.push(at);
        delete movies[movie.id].showtimes;
      });
    });
    return movies;
  };

  if (data.ferd.text.trim() === '') {
    help();
    return;
  }

  var locator = data.ferd.text || '94102';

  var location = showtimes(locator, { lang: 'en', pageLimit: 10 });
  location.getTheaters(function (err, theaters) {
    if (!theaters) {
      send("No movies found near this location. :sweat:");
    } else {
      var movies = toArray(transform(theaters));
      var attachments = style(movies);
      send("These movies are showing: ")
        .then(function(){
          attachments.forEach(function (movie) {
            send(null, movie);
          });  
        });

    }
    
  });

};

module.exports = function(data, ferd) {
  handler(data, ferd);
};
