import React, { useState } from 'react'
import Select from 'react-select'
import { gql } from 'apollo-boost'
import { useMutation } from 'react-apollo'

const SET_BIRTHYEAR = gql`
mutation setBorn($name: String! $setBornTo: Int!) {
  editAuthor (
    name: $name
    setBornTo: $setBornTo
  ) {
    name
    born
    id
  }
}
`

const SetBirthyear = ({ authors, handleError }) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const options = [...authors.map(a => ({ value: a, label: a }))]

  const [setBirthyear] = useMutation(SET_BIRTHYEAR,
    {
      variables: { name: name.value, setBornTo: parseInt(born) }
    }
  )

  const submit = (e) => {
    e.preventDefault()

    setBirthyear().catch((error) => handleError(error))

    setName('')
    setBorn('')
  }

  return (
    <div>
      <h3>set birthyear</h3>
      <form onSubmit={submit}>
        <div style={{ width: "50%" }}>
          <Select
            placeholder={'select author...'}
            options={options}
            onChange={(selected) => setName(selected)}
            value={name}
          />
        </div>
        <div>
          born
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type='submit'>update author</button>
      </form>
    </div>
  )
}

export default SetBirthyear