const express = require('express');

const bcrypt = require('bcryptjs');

const knex = require('knex');
const knexConfig = require('./knexfile.js');
const db = knex(knexConfig.development);

const server = express(); 

server.use(express.json());

server.post('/api/register', async (req, res) => {
    const user = req.body;

    if (!user.username || !user.password) {
        return res.status(500).json({ message: 'Need username and password' });
      }
    
      if (user.password.length < 8) {
        return res.status(400).json({ message: 'Password is too short!' });
       }
    
      const hash = bcrypt.hashSync(user.password, 14);
      user.password = hash
    
     try{ const newUser = await db.insert(user).into('Users')
        .then(saved => {
          res.status(201).json(saved);
        })
        .catch(error => {
          res.status(500).json(error);
          console.log(error)
        }); }
        catch(error){console.log(error)}   

});

server.post('/api/login', async (req, res) => {
    let { username, password } = req.body;
  
      const user = await db('Users').where('username', '=', { username })
      .first()
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
          res.status(200).json({ message: `Welcome ${user.username}!` });
        } else {
          res.status(401).json({ message: 'Invalid Credentials' });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
  });
  
  function authorize(req, res, next) {
    const username = req.headers['x-username'];
    const password = req.headers['x-password'];
  
    if (!username || !password) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }
  
    const User = db('Users').where('username', '=', { username })
      .first()
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
          next()
        } else {
          res.status(401).json({ message: 'Invalid Credentials' });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
  }

  server.get('/api/users', authorize, (req, res) => {
    db('Users')
      .then(users => {
        res.json(users);
      })
      .catch(err => res.send(err));
  });




const PORT = process.env.PORT || 5000; 
server.listen(PORT, () => console.log(`server running on ${PORT}`))