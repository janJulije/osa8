import React from 'react'
import SetBirthyear from './Authors_SetBirthyear'

const Authors = (props) => {
  if (!props.show) {
    return null
  }
  if (props.authors.loading) {
    return <p>Loading...</p>
  }

  const authors = props.authors.data.allAuthors

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      { props.loggedIn &&
        <SetBirthyear
          authors={authors.map(a => a.name)}
          handleError={props.handleError}
        />
      }
    </div>
  )
}

export default Authors