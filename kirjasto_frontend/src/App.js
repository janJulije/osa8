import React, { useState } from 'react'
import { useQuery, useMutation, useSubscription, useApolloClient } from 'react-apollo'
import { gql } from 'apollo-boost'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/Login'

const GET_AUTHORS = gql`
query {
  allAuthors {
    name
    born
    bookCount
    id
  }
}
`
const GET_BOOKS = gql`
query {
  allBooks {
    title
    author {
      name
      born
    }
    genres
    published
    id
  }
}
`
const ADD_BOOK = gql`
mutation createBook($title: String!, $published: Int, $author: String!, $genres: [String!]) {
  addBook (
    title: $title
    published: $published
    authorName: $author
    genres: $genres
  ) {
    title
    published
    author {
      name
      born
      id
    }
    genres
  }
}
`
const BOOK_ADDED = gql`
subscription {
  bookAdded {
    title
    author {
      name
      born
    }
    genres
    published
    id
  }
}
`

const App = () => {
  const [page, setPage] = useState('authors')
  const [errorMessage, setErrorMessage] = useState(null)
  const [loggedIn, setLoggedIn] = useState(!(sessionStorage.getItem('token') === ''))

  const client = useApolloClient()

  const handleError = (error) => {
    setErrorMessage(error.message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }

  const authors = useQuery(GET_AUTHORS, {
    onError: handleError
  })
  const books = useQuery(GET_BOOKS)

  const [addBook] = useMutation(ADD_BOOK, {
    onError: handleError,
    refetchQueries: [
      { query: GET_AUTHORS }
    ]
  })

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      console.log(subscriptionData)
      window.alert(`Subscription returned added book ${subscriptionData.data.bookAdded.title}`)

      const currentBooks = client.readQuery({ query: GET_BOOKS })
      client.writeQuery({
        query: GET_BOOKS,
        data: { allBooks: currentBooks.allBooks.concat(subscriptionData.data.bookAdded) }
      })
    }
  })

  const logInOut = () => {
    if (loggedIn) {
      return <button
        onClick={() => {
          sessionStorage.setItem('token', '')
          setLoggedIn(false)
        }}
        style={{ marginLeft: '10px', color: 'red' }}
      >log out</button>
    } else {
      if (page === 'login') {
        return null
      }
      return <button
        onClick={() => setPage('login')}
        style={{ marginLeft: '10px' }}
      >log in</button>
    }
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {loggedIn && <button onClick={() => setPage('add')}>add book</button>}
        {logInOut()}
      </div>

      <div style={{ color: 'red' }}>{errorMessage}</div>

      <Login
        show={page === 'login'}
        handleError={handleError}
        setLoggedIn={setLoggedIn}
      />

      <Authors
        show={page === 'authors'}
        authors={authors}
        handleError={handleError}
        loggedIn={loggedIn}
      />

      <Books
        show={page === 'books'}
        books={books}
      />

      <NewBook
        show={page === 'add'}
        addBook={addBook}
      />

    </div>
  )
}

export default App