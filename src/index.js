const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages.js')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

// let count = 0
const welcomeMsg = 'Welcome!'
const systemUser = 'SYSTEM'

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', ({ username, room }, acknowledge) => {
        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        })

        if(error){
            return acknowledge(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage(systemUser, welcomeMsg))
        socket.broadcast.to(user.room).emit('message', generateMessage(systemUser, `${user.username} has joined the chat!`))

        io.to(user.room).emit('roomData', {
            users: getUsersInRoom(user.room),
            room: user.room
        })
        
        acknowledge()
    })

    socket.on('sendMessage', (msg, acknowledge) => {
        const filter = new Filter()

        if(filter.isProfane(msg)){
            return acknowledge('Profanity is not allowed!', undefined)
        }

        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, msg))
        acknowledge(undefined, 'Delivered!')
    })

    socket.on('sendLocation', ({ latitude, longitude }, acknowledge) => {
        const user = getUser(socket.id)
        const googleMapURL = `https://google.com/maps?q=${latitude},${longitude}`

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, googleMapURL))
        acknowledge('Location shared!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(systemUser, `${user.username} has left the chat!`))

            io.to(user.room).emit('roomData', {
                users: getUsersInRoom(user.room),
                room: user.room
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})