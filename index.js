require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const shortid = require('shortid');
const validUrl = require('valid-url');
const mongoose = require('mongoose');
const URI = process.env['MONGO_URI'];
 
// Connect db
mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Create Schema
const link_schema = new mongoose.Schema({
  "original_url": { type: String, required: true },
  "short_url": { type: String, required: true }
})

const Link = new mongoose.model('link', link_schema)

//url validate regex
const urlregex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.urlencoded({ extended: false
}));

//starting view
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(function(req, res, next){
  console.log(`${req.method} ${req.path} - ${req.ip} `);
  next();
})

app.post('/api/shorturl', async (req, res) => {
  //validate url
  if (!urlregex.test(req.body.url)) {
    return res.json({
      error: "invalid url"
    })
  } else {
    try {
      const original = await Link.findOne({ original_url: req.body.url })
      if (original) {
        //if url already exists -> return the db entry
        return res.status(200).json({
          "original_url": original.original_url,
          "short_url": original.short_url
        })
      } else {
        //if url doesn't exist -> create, save and return new entry
        const new_url = new Link({
          original_url: req.body.url,
          short_url: shortid.generate(req.body.url)
        })
        console.log("new_url: \n" + new_url);
        await new_url.save();
        return res.status(200).json({
          "original_url": new_url.original_url,
          "short_url": new_url.short_url
        })
      }
    } catch (err) {
      console.log(err)
      return res.json({
        "error": "Bad Request"
      })
    }
  }
  console.log('_____________________')
})

//redirect when short_url provided
app.get('/api/shorturl/:id?', async (req, res) => {
  try {
    //check if short_url exists in db
    const search = await Link.findOne({ short_url: req.params.id });
    console.log(search)
    console.log(typeof (search))
    if (!search) {
      return res.json({
        "error": "invalid url"
      })
    }
    console.log(search.original_url)
    return res.redirect(301, search.original_url)
  } catch (err) {
    console.log(err);
    return res.json({
      "error": "Bad Request"
    })
  }
})

var listener = app.listen(process.env['PORT'], function () {
  console.log('Your app is listening on port ' + listener.address().port);
  });
