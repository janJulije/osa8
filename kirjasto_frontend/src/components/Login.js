import React, { useState } from 'react'
import { gql } from 'apollo-boost'
import { useMutation } from 'react-apollo'

const LOGIN = gql`
mutation login($username: String! $password: String!) {
  login (
    username: $username
    password: $password
  ) {
    value
  }
}
`

const Login = ({ show, handleError, setLoggedIn }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [login] = useMutation(LOGIN,
    {
      variables: { username: username, password: password }
    }
  )

  if (!show) {
    return null
  }

  const submit = async (e) => {
    e.preventDefault()

    try {
      const token = await login()
      if (token.data.login.value) {
        sessionStorage.setItem('token', token.data.login.value)
      }
      setLoggedIn(true)

      setUsername('')
      setPassword('')
    } catch (error) {
      error.message = 'incorrect username or password'
      handleError(error)
    }
  }

  return (
    <div>
      <h2>Log in</h2>
      <form onSubmit={submit}>
        <div>
          username
          <input
            type='text'
            value={username}
            onChange={({ target }) => setUsername(target.value)}
          />
        </div>
        <div>
          password
          <input
            type='password'
            value={password}
            onChange={({ target }) => setPassword(target.value)}
          />
        </div>
        <button type='submit'>log in</button>
      </form>
    </div>
  )
}

export default Login