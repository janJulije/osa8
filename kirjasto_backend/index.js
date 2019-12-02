const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
  PubSub
} = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const DataLoader = require('dataloader')

const BookModel = require('./src/models/book')
const AuthorModel = require('./src/models/author')
const UserModel = require('./src/models/user')

require('dotenv').config()

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const pubsub = new PubSub()

const bookLoader = new DataLoader(async bookIds => {
  const bookArrays = await BookModel.find({ author: { $in: bookIds } })
  let booksByAuthor = []
  bookArrays.forEach(book => {
    if (!booksByAuthor[book.author]) {
      booksByAuthor[book.author] = []
    }
    booksByAuthor[book.author] = booksByAuthor[book.author].concat(book)
  })
  console.log(booksByAuthor)
  return bookIds.map(author => booksByAuthor[author])
})

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int
    author: Author!
    genres: [String!]
    id: ID!
  }

  type Query {
    hello: String!
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook (
      title: String!
      published: Int
      authorName: String!
      genres: [String!]
    ): Book
    editAuthor (
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`

const resolvers = {
  Author: {
    bookCount: async (root, args, context) => {
      const books = await context.bookLoader.load(root._id)
      return books.length
    }
  },

  Query: {
    bookCount: async () => {
      const books = await BookModel.find({})
      return books.length
    },
    authorCount: async () => {
      const authors = await AuthorModel.find({})
      return authors.length
    },
    allBooks: async (root, args) => {
      const books = await BookModel.find({}).populate('author')
      return books.filter(book => {
        return (
          (!args.author || book.author.name === args.author)
          && (!args.genre || book.genres.includes(args.genre))
        )
      })
    },
    allAuthors: async () => {
      const authors = await AuthorModel.find({})
      return authors
    },
    me: async (root, args, context) => {
      const user = await UserModel.findOne({ username: context.currentUser.username })
      return user
    }
  },

  Mutation: {
    addBook: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      let fullAuthor = await AuthorModel.findOne({ name: args.authorName })
      if (!fullAuthor) {
        const author = new AuthorModel({
          name: args.authorName,
          books: []
        })
        fullAuthor = await author.save()
          .catch(error => {
            throw new UserInputError(error.message, {
              invalidArgs: args
            })
          })
      }

      const book = new BookModel({
        ...args,
        author: fullAuthor._id
      })

      const returnedBook = await book.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        })

      returnedBook.author = fullAuthor

      fullAuthor.books = fullAuthor.books.concat(returnedBook._id)
      await fullAuthor.save()

      pubsub.publish('BOOK_ADDED', { bookAdded: returnedBook })

      return returnedBook
    },

    editAuthor: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      let author = await AuthorModel.find({ name: args.name })
      author = author[0]
      if (!author) {
        return null
      }

      author.born = args.setBornTo
      const returnedAuthor = await author.save()
      return returnedAuthor
    },

    createUser: async (root, args) => {
      const user = new UserModel({
        username: args.username,
        favoriteGenre: args.favoriteGenre
      })
      const returnedUser = await user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        })
      return returnedUser
    },

    login: async (root, args) => {
      if (args.password !== process.env.TEMP_PASSWORD) {
        throw new UserInputError('incorrect password or username', {
          invalidArgs: args
        })
      } else {
        const user = await UserModel.findOne({ username: args.username })
        if (!user) {
          throw new UserInputError('incorrect password or username', {
            invalidArgs: args
          })
        }
        const tokenUser = {
          username: user.username,
          id: user._id
        }
        const token = await jwt.sign(tokenUser, process.env.JWT_SECRET)
        return { value: token }
      }
    }
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      )
      const currentUser = await UserModel.findById(decodedToken.id)
      return { currentUser, bookLoader }
    }
  }
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})