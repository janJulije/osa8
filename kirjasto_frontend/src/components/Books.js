import React, { useState, useEffect, useCallback } from 'react'
import { gql } from 'apollo-boost'
import { useApolloClient } from 'react-apollo'

const GET_BOOKS_OF_GENRE = gql`
query getGenre($genre: String) {
  allBooks(
    genre: $genre
  ) {
    title
    author {
      name
      born
    }
    published
    id
  }
}
`

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [showTheseBooks, setShowTheseBooks] = useState([])

  const client = useApolloClient(GET_BOOKS_OF_GENRE)

  const fetchGenreBooks = async (genre, books) => {
    if (!genre) {
      setShowTheseBooks(books.allBooks)
      return
    }
    const genreBooks = await client.query({
      query: GET_BOOKS_OF_GENRE,
      variables: { genre: genre },
      fetchPolicy: 'no-cache'
    })
    setShowTheseBooks(genreBooks.data.allBooks)
  }

  const memoizedFetchGenreBooks = useCallback(
    () => {
      fetchGenreBooks(selectedGenre, props.books.data)
    },
    // eslint-disable-next-line
    [selectedGenre, props.books.data]
  )

  useEffect(() => {
    if (props.books.data) {
      memoizedFetchGenreBooks()
    }
  }, [props.books.data, memoizedFetchGenreBooks])

  if (!props.show) {
    return null
  }

  if (props.books.loading) {
    return <p>Loading...</p>
  }

  let books = props.books.data.allBooks

  if (showTheseBooks.length < 1 && books.length >= 1) {
    setShowTheseBooks(books)
  }

  let genres = []
  books.forEach(book => {
    if (book.genres) {
      book.genres.forEach(genre => {
        if (!genres.includes(genre)) {
          genres = genres.concat(genre)
        }
      })
    }
  })

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {showTheseBooks.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div>
        {selectedGenre ?
          <p>selected filter: {selectedGenre}</p> :
          <p>no filter selected</p>
        }
        <button onClick={() => setSelectedGenre(null)}>all genres</button>
        {genres.map(genre =>
          <button key={genre} onClick={() => setSelectedGenre(genre)}>{genre}</button>
        )}
      </div>
    </div>
  )
}

export default Books