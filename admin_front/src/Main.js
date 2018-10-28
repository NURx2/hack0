import React, { Component } from 'react'
import openSocket from 'socket.io-client'
import axios from 'axios'
import defaultAvatar from './default_avatar.svg'
import GoogleMap from 'google-map-react'
import Modal from './Modal.js'
import { throws } from 'assert';

export default class App extends Component {
  constructor(prps) {
    super(prps)
    let token = undefined
    if (window.localStorage.getItem('token') !== undefined)
      token = window.localStorage.getItem('token')
    this.state = {
      socket: openSocket('http://172.31.19.207:80'),
      online: false,
      token: token,
      form_login: '',
      form_password: '', 
      rooms: [], 
      roomsReady: false,
      modalVisible: false,
      currentRoom: -1
    }
    this.state.socket.on('connect', () => {
      console.log('Connected')
      if (this.state.token)
        this.state.socket.emit('owned', {
          token: this.state.token
        })
      this.setState({
        online: true,
      })
    })
    this.state.socket.on('reset token', () => {
      this.setState({
        token: undefined,
      })
    })
    this.state.socket.on('disconnect', () => {
      console.log('Disconnected')
      this.setState({
        online: false,
      })
    })
    this.state.socket.on('logged_in', (data) => {
      let token = data.token
      this.state.socket.emit('owned', {
        token: token
      })
      this.setState({
        token: token
      })
      window.localStorage.setItem('token', token)
    })
    this.state.socket.on('login', data => {
      this.setState({
        login: data.login
      })
    })
    this.state.socket.on('owned', data => {
      this.setState({
        roomsReady: true,
        rooms: data
      })
    })
  }

  login() {
    if (this.state.online) {
      this.state.socket.emit('login', {
        login: this.state.form_login,
        password: this.state.form_password
      })
    } 
  }

  register() {
    alert('Sorry not ready yet')
  }

  onChange(event) {
    let name = event.target.id
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }

  logout() {
    console.log('here')
    this.setState({
      token: undefined
    })
    window.localStorage.getItem('token', undefined)
  }

  closeModal() {
    this.setState({
      modalVisible: false
    })
  }

  showModal() {
    this.setState({
      modalVisible: true
    })
  }

  renderModalHeader() {
    return (
      <div className = 'row'>
        <h2>Queue settings</h2>
        <div className = 'closeBtn' onClick = {this.closeModal.bind(this)}>close</div>
      </div>
    )
  }

  deleteRoom() {
    if (0 <= this.state.currentRoom && this.state.currentRoom < this.state.rooms.length) {
      this.closeModal()
      this.state.socket.emit('remove room', {
        token: this.state.token,
        pin: this.state.rooms[this.state.currentRoom].pin
      })
    }
  }

  doneOne() {
    if (0 <= this.state.currentRoom && this.state.currentRoom < this.state.rooms.length) {
      this.state.socket.emit('done one', {
        token: this.state.token,
        pin: this.state.rooms[this.state.currentRoom].pin
      })
    }
  }

  renderModalContent() {
    let current = this.state.rooms[this.state.currentRoom]
    let name = current.name
    let load = 0
    if (current.queue)
      load = current.queue.length
    let serving = undefined
    let next = undefined
    if (current.queue) {
      if (current.queue.length >= 1)
        serving = current.queue[0]
      if (current.queue.length >= 2)
        next = current.queue[1]
    }
    return (
      <div className = 'modalContentTwoParts'>
        <div className = 'queueInfo'>
          <div>
            <h2>{name} <span onClick = {this.deleteRoom.bind(this)} className = 'deleteRoom'>delete</span></h2>
            <h3>Now in queue: {load}</h3>
            <br/>
            <h2>{serving ? 'Serving: ' + serving.login : ''}</h2>
            <h2>{next ? 'Next: ' + next.login : ''}</h2>
          </div>
          <div className = 'centerit'>
            <div className = 'btn btn-done' onClick = {this.doneOne.bind(this)}>Done</div>
          </div>
        </div>
        <div>
          <GoogleMap
            bootstrapURLKeys={{ key: 'AIzaSyAAEx-l-cLNXot0HlsyNoCg7Z4kyCGLfdw' }}
            defaultCenter={
              {
                lat: 59.95,
                lng: 30.33
              }
            }
            defaultZoom={11}
          ></GoogleMap>
        </div>
      </div>
    )
  }

  roomClicked(index, event) {
    event.preventDefault()
    this.setState({
      currentRoom: index
    })
    this.showModal()
  }

  render() {
    return (
      <div className="wrapper">
        <Modal
          renderContent = {this.renderModalContent.bind(this)}
          renderHeader = {this.renderModalHeader.bind(this)}
          visible = {this.state.modalVisible} />
        <header>
          <h1>Administration panel</h1>
        </header>
        {this.state.token ? (
          <main>
            <div className = 'profile'>
              <div className = 'overwrapper'>
                <div className = 'profileImagePadder'>
                  <img className = 'profileImage' src = {this.state.profileImage ? this.state.profileImage : defaultAvatar} />
                </div>
              </div>
              <div className = 'profileWrapper'>
                <div className = 'login'>{this.state.login ? this.state.login : 'Loading...'}</div>
                <div>Amount of rooms: {this.state.roomsReady ? this.state.rooms.length : 'Loading...'}</div>
                <div onClick = {this.logout.bind(this)} className = 'logout'>Logout</div>
              </div>
            </div>
            <div className = 'content'>
              <div className = 'dashboard'>
                <GoogleMap
                  bootstrapURLKeys={{ key: 'AIzaSyAAEx-l-cLNXot0HlsyNoCg7Z4kyCGLfdw' }}
                  defaultCenter={
                    {
                      lat: 59.95,
                      lng: 30.33
                    }
                  }
                  defaultZoom={11}
                >
                  <div className = 'circle' lat={59.955413} lng={30.337844}></div>
                </GoogleMap>
              </div>
              <div className = 'rooms'>
                {this.state.rooms.map((el, index) => {
                  let currentLoad = ''
                  if (el.queue && el.queue.length !== 0)
                    currentLoad = el.queue.length
                  let loadClass = 'low-load'
                  if (el.queue && el.queue.length >= 5)
                    loadClass = 'middle-load'
                  if (el.queue && el.queue.length >= 10)
                    loadClass = 'high-load'

                  let roomClasses = 'roomCard ' + loadClass
                  
                  return (
                    <div onClick = {this.roomClicked.bind(this, index)} key = {index} className = {roomClasses}>
                      <div className = 'roomName'>{el.name}</div>
                      <div className = 'roomInfo'>
                        <div className = 'roomLoad'>{currentLoad}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </main>
        ) : (
          <div className="advertising">
            <div className = 'advert'>
              <div className = 'huge'>No more <br/> queues</div>
              <div className = 'small'>Our project will make <br/>your queues more user friendly <br/>and it will help you to analyze <br/>your workers performance</div>
            </div>
            <div>
              <div className = 'login-form'>
                <h3>Please login</h3>
                <h4>Than you will be able to administrate your queues</h4>
                <h5>Enter your login:</h5>
                <input onChange = {this.onChange.bind(this)} id = 'form_login' type="text" value={this.state.form_login} />
                <h5>Enter your password:</h5>
                <input onChange = {this.onChange.bind(this)} id = 'form_password' type="password" value={this.state.form_password} />
                <br/>
                <div className="row">
                  <button className = 'btn btn-login' onClick = {this.login.bind(this)}>Sign in</button>
                  <button className = 'btn btn-register' onClick = {this.register.bind(this)}>Register</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className = 'why'>
        </div>
        <footer>
          <h6>Queueueueu</h6>
        </footer>
      </div>
    )
  }
}
