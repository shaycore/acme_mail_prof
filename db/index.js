const Sequelize = require('sequelize');
const { ENUM, STRING, VIRTUAL } = Sequelize;
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_mail_db');

const User = conn.define('user', {
  firstName: {
    type: STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  lastName: {
    type: STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fullName: {
    type: VIRTUAL,
    get: function(){
      return `${this.firstName} ${this.lastName}`;
    }
  },
  userLevel: {
    type: ENUM('POWER', 'REGULAR', 'RESTRICTED'),
    allowNull: false,
    defaultValue: 'REGULAR'
  }

});

//Class Method
User.getPowerUsers = function() {
  return User.findAll({
    where: {
      userLevel: 'POWER'
    },
    include: [
      { model: Message, as: 'sent' },
      { model: Message, as: 'received' }
    ]
  });
}
//THIS is a promise! It returns a promise! whoever is using this code will need to use an 'await' before it.

const Message = conn.define('message', {
  subject: {
    type: STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
});

Message.belongsTo(User, { as: 'from' });
Message.belongsTo(User, { as: 'to' });
User.hasMany(Message, {as: 'sent', foreignKey: 'fromId'});
User.hasMany(Message, {as: 'received', foreignKey: 'toId'});



const syncAndSeed = async()=> {
  await conn.sync({ force: true }); 
  const [ moe, larry, lucy, ethyl ] = await Promise.all(
    [
      { firstName: 'moe', lastName: 'green', userLevel: 'POWER'},
      { firstName: 'larry', lastName: 'lubin'},
      { firstName: 'lucy', lastName: 'lasser', userLevel: 'RESTRICTED'},
      { firstName: 'ethyl', lastName: 'evans'},
    ].map( user => User.create(user))
  );
  const [ hi, bye, hello ] = await Promise.all(
    [
      { subject: 'hi', fromId: moe.id, toId: lucy.id },
      { subject: 'bye', fromId: lucy.id, toId: moe.id  },
      { subject: 'hello', fromId: ethyl.id, toId: larry.id  },
    ].map( message => Message.create(message))
  );
};


module.exports = {
  conn,
  User,
  Message,
  syncAndSeed
};
