# tasks-app
tasks app

This is a Tasks app API

## app

This API has:
- An authentication system
- A register system
- A task CRUD
- A health check endpoint
- An endpoint of one exercise (finde item in array)


## technologies dependencies

* Node (v10.15.0)

## install and use

* clone the repository
```
$ git clone https://github.com/gAmadorH/tasks-app.git
```

* go to the directory
```
$ cd tasks-app
```

* install dependencies
```
$ npm i
```

* make a `.env` file like this with you own information
```
PORT=3001
JWT_SECRET=TtKDKjij40xfzJPWqAUBBtW3nmq
DATABASE_URL=mysql://user:password@localhost:3306/tasks-app-db
```

* run the app
```
$ npm start
```