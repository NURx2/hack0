let express = require('express')
let http = require('http')
let bParser = require('body-parser')
let db = require('./db')
let utils = require('./utils')
require('colors')
require('dotenv').config()

let app = express()
let server = http.Server(app)
let io = require('socket.io')(server)

let dbUrl = process.env.db_url
    .replace('<dbuser>', process.env.db_user)
    .replace('<dbpassword>', process.env.db_password)

db.connect(dbUrl)
.then(() => {
    io.on('connect', (socket) => {
        socket.on('myposition', (data) => {
            let token = data.token,
                pin = data.pin
            if (!token) {
                socket.emit('error', 'Token is empty')
                return
            }
            if (!pin) {
                socket.emit('error', 'Pin is empty')
                return
            }

            db.getposition(token, pin)
            .then(data => {
                console.log(data)
                socket.emit('updposition', data)
            })
            .catch(err => {
                console.log(err)
                socket.emit('error', err)
            })
        })
    })

    app.use((req, res, next) => {
        console.log(`[${req.method}]: ${req.url} ${req.ip}`.cyan)
        next()
    })

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    app.use(bParser.json())
    app.use(bParser.urlencoded({extended: true}))

    app.get('/', (req, res) => {
        res.send('not implemented yet')
    })

    app.post('/login', (req, res) => {
        let login = req.body.login,
            password = req.body.password

        db.login(login, password)
        .then(data => {
            res.send({
                token: utils.createToken(login, password)
            })
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/register', (req, res) => {
        let login = req.body.login, 
            password = req.body.password
        db.register(login, password)
        .then(data => {
            res.send({
                token: utils.createToken(login, password)
            })
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/initiate_room', (req, res) => {
        let token = req.body.token
        if (!token) {
            res.send({
                err: 'Token not found, please login'
            })
            return
        }
        db.init_room(token)
        .then(data => {
            console.log(data)
            res.send({ pin: data })
        })
        .catch(err => {
            res.send({
                err: 'Invalid token'
            })
        })
    })

    app.post('/owned_rooms', (req, res) => {
        let token = req.body.token
        db.getOwnedRooms(token)
        .then(data => {
            res.send(data)
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/join', (req, res) => {
        let token = req.body.token,
            room_pin = req.body.pin
        db.join(token, room_pin)
        .then(data => {
            res.send({
                token: data.token
            })
        })
        .catch(err => {
            console.log(err)
            res.send({
                err: err
            })
        })
    })

    app.post('/myposition', (req, res) => {
        let token = req.body.token,
            pin = req.body.pin
        db.getposition(token, pin)
        .then(data => {
            console.log(data)
            res.send(data)
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/leave', (req, res) => {
        let token = req.body.token,
            pin = req.body.pin
        db.leave(token, pin)
        .then(data => {
            res.send({
                message: data
            })
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    server.listen(process.env.port, (err) => {
        if (err) {
            console.log(('Error ' + err).red)
        } else {
            console.log(('Successfully running on port: ' + process.env.port).green)
        }
    })
})