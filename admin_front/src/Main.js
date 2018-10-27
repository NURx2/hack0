import React, { Component } from 'react'
import openSocket from 'socket.io-client'
import axios from 'axios'

export default class App extends Component {
  constructor(prps) {
    super(prps)
    let token = undefined
    if (window.localStorage.getItem('token') !== undefined)
      token = window.localStorage.getItem('token')
    this.state = {
      socket: openSocket('http://localhost:80'),
      online: false,
      token: token,
      form_login: '',
      form_password: ''
    }
    this.state.socket.on('connect', () => {
      console.log('Connected')
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
      this.setState({
        token: token
      })
      window.localStorage.setItem('token', token)
    })
  }

  login() {
    console.log(this.state.form_login, this.state.form_password)
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

  render() {
    return (
      <div className="wrapper">
        <header>
          <h1>Administration panel</h1>
        </header>
        {this.state.token ? (
          <div>You are loggined</div>
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