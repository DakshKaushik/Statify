const express = require("express");
require('dotenv').config()
const app = express();
const axios=require('axios');
const CLIENT_ID=process.env.CLIENT_ID;
const CLIENT_SECRET=process.env.CLIENT_SECRET;
const REDIRECT_URI=process.env.REDIRECT_URI;
const FRONTEND_URI=process.env.FRONTEND_URI;
const PORT=process.env.PORT||3000;
const path=require('path');

const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
const state_key='spotify_auth_state'
app.get('/login',(req,res)=>{  
    const state =generateRandomString(16);
    const scope='user-read-private user-read-email user-read-recently-played user-top-read user-library-read'
    res.cookie(state_key,state)
    const searchparams = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        state:state_key,
        scope:scope,
    })
    const queryParams = searchparams.toString()
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`)
});
app.get('/callback', (req, res) => {
    const code = req.query.code || null;
  
    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
    })
    .then(response => {
        if (response.status === 200) {
            const{access_token,refresh_token,expires_in}=response.data;
            const searchparams = new URLSearchParams({
                access_token,
                refresh_token,
                expires_in
            })
            const queryParams = searchparams.toString()
            res.redirect(`${FRONTEND_URI}?${queryParams}`)
            
    
        } else {
          res.redirect(`/${new URLSearchParams({error:'invalid token'}).toString()}`)
        }
      })
      .catch(error => {
        res.send(error);
      });
});
app.get('/refresh_token', (req, res) => {
    const { refresh_token } = req.query;
  
    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
    })
      .then(response => {
        res.send(response.data);
      })
      .catch(error => {
        res.send(error);
      });
  });

app.use(express.static(path.join(__dirname, "/client/build")));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build', 'index.html'));
  });
app.listen(PORT, () => {
    console.log(`Server is up and running on ${PORT} ...`);
  });

