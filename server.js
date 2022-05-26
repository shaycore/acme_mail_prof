const db = require('./db');
const { conn, User, Message, syncAndSeed } = db;
const express = require('express');
const app = express();

app.use(express.urlencoded({ extended:false }));
app.use('/assets', express.static('assets'));

app.get('/', async(req, res, next)=> {
  try {
    const [ users, messages, powerUsers ] = await Promise.all([
      User.findAll(),
      Message.findAll(),
      User.getPowerUsers()
    ]);
    res.send(`
      <html>
        <head>
          <title>Acme Mail</title>
          <link rel='stylesheet' href='/assets/my_styles.css' />
        </head>
        <body>
          <nav>
            <a href='/' class='selected'>Home</a>
            <a href='/users'>Users</a>
            <a href='/messages'>Messages</a>
          </nav>
          <p>
            We have ${ users.length } users and we have ${ messages.length } messages!
            <br>
            We have ${ powerUsers.length } Power Users. :-)
          </p>
        </body>
      </html>
    `);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/users', async(req, res, next)=> {
  try {
    const users = await User.findAll({
      include: [
        { model: Message, as: 'sent' },
        { model: Message, as: 'received' }
      ]
    });
    res.send(`
      <html>
        <head>
          <title>Acme Mail</title>
          <link rel='stylesheet' href='/assets/my_styles.css' />
        </head>
        <body>
          <nav>
            <a href='/'>Home</a>
            <a href='/users' class='selected'>Users</a>
            <a href='/messages'>Messages</a>
          </nav>
          <a href='/users/power'>Filter Power Users</a>
          <ul>
            ${
              users.map( user => {
                return `
                  <li>
                    ${ user.fullName } (${ user.userLevel })
                    <div>
                      Sent ${ user.sent.length } messages
                      <br />
                      Received ${ user.received.length } messages
                    </div>
                  </li>
                `;
              }).join('')
            }
          </ul>
        </body>
      </html>
    `);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/users/power', async(req, res, next)=> {
  try {
    const users = await User.getPowerUsers();
    res.send(`
      <html>
        <head>
          <title>Acme Mail</title>
          <link rel='stylesheet' href='/assets/my_styles.css' />
        </head>
        <body>
          <nav>
            <a href='/'>Home</a>
            <a href='/users' class='selected'>Users</a>
            <a href='/messages'>Messages</a>
          </nav>
          <a href='/users/'>All Users</a>
          <ul>
            ${
              users.map( user => {
                return `
                  <li>
                    ${ user.fullName } (${ user.userLevel })
                    <div>
                      Sent ${ user.sent.length } messages
                      <br />
                      Received ${ user.received.length } messages
                    </div>
                  </li>
                `;
              }).join('')
            }
          </ul>
        </body>
      </html>
    `);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/messages', async(req, res, next)=> {
  try {
    const messages = await Message.findAll({
      include: [
        { model: User, as: 'from' },
        { model: User, as: 'to' }
      ]
    });
    const users = await User.findAll();
    res.send(`
      <html>
        <head>
          <title>Acme Mail</title>
          <link rel='stylesheet' href='/assets/my_styles.css' />
        </head>
        <body>
          <nav>
            <a href='/'>Home</a>
            <a href='/users'>Users</a>
            <a href='/messages' class='selected'>Messages</a>
          </nav>
          <form method='POST'>
            <select name ='fromId'>
              <option>-- from Id</option>
              ${
                users.map(user => {
                  return `
                    <option value=${user.id}>${ user.fullName }</option>
                  `
                }).join('')
              }
            </select>
            <select name ='toId'>
              <option>-- to --</option>
              ${
                users.map(user => {
                  return `
                    <option value=${user.id}>${ user.fullName }</option>
                  `
                }).join('')
              }
            </select>
            <input name='subject' placeHolder='enter subject' />
            <button>CREATE</button>
          </form>
          <ul>
            ${
              messages.map( message => {
                return `
                  <li>
                    ${ message.subject }
                    FROM: ${ message.from.fullName }
                    TO: ${ message.to.fullName }
                  </li>
                `;
              }).join('')
            }
          </ul>
        </body>
      </html>
    `);
  }
  catch(ex){
    next(ex);
  }
});

app.post('/messages', async(req, res, next) => {
  try {
    await Message.create(req.body);
    res.redirect('/messages');
  }
  catch(ex){
    next(ex);
  }
});

app.use((err,req, res, next) => {
  console.log(err);
  res.status(500).send(err);
});

const bootstrap = async()=> {
  try {
    await syncAndSeed();
    console.log('seeded data');
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> console.log(`listening on port ${port}`));
  }
  catch(ex){
    console.log(ex);
  }
};

bootstrap();
