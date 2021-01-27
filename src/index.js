const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages.js')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

app.get('/', (req, res) => {
    res.render('index')
})

// let count = 0
const welcomeMsg = 'Welcome!'

io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    
    socket.emit('message', generateMessage(welcomeMsg))
    socket.broadcast.emit('message', generateMessage('A new user has joined the chat!'))

    socket.on('sendMessage', (msg, acknowledge) => {
        const filter = new Filter()

        if(filter.isProfane(msg)){
            return acknowledge('Profanity is not allowed!', undefined)
        }
        io.emit('message', generateMessage(msg))
        acknowledge(undefined, 'Delivered!')
    })

    socket.on('sendLocation', ({ latitude, longitude }, acknowledge) => {
        const googleMapURL = `https://google.com/maps?q=${latitude},${longitude}`
        io.emit('locationMessage', generateLocationMessage(googleMapURL))
        acknowledge('Location shared!')
    })

    socket.on('disconnect', () => {
        io.emit('message', generateMessage('A user has left the chat!'))
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})