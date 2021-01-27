const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (locationMessage) => {
    const html = Mustache.render(locationTemplate, {
        locationURL: locationMessage.locationURL,
        createdAt: moment(locationMessage.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
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