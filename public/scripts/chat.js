const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // Distance scrolled from top
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (locationMessage) => {
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        locationURL: locationMessage.locationURL,
        createdAt: moment(locationMessage.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ users, room }) => {
    const html = Mustache.render(sidebarTemplate, {
        users,
        room
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // disable form until message is sent
    $messageFormButton.setAttribute('disabled', 'disabled')

    // const message = document.querySelector('input').value

    const message = e.target.elements['message'].value
    socket.emit('sendMessage', message, (acknowledgeError, acknowledgeMsg) => {
        // enable button and clear input fields
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(acknowledgeError){
            console.log('Message not delivered!')
            alert(acknowledgeError)
            return
        }
        console.log('Message sent successfully!')
        console.log(acknowledgeMsg)
    })
})

$sendLocationButton.addEventListener('click', () => {
    const geoLocation = navigator.geolocation
    
    if(!geoLocation){
        return alert('Geolocation is not supported by the current version of your browser!')
    }

    // disable send-location button until location is sent
    $sendLocationButton.setAttribute('disabled', 'disabled')

    geoLocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (acknowledgeMsg) => {
            // enable send-location button
            $sendLocationButton.removeAttribute('disabled')
            console.log(acknowledgeMsg)
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})