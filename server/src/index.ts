import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import passport from 'passport'
import passportLocal from 'passport-local'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import bcrypt from 'bcryptjs'
import User from './Models/UserModel'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import { DatabaseUserInterface, UserInterface } from './Interfaces/UserInterface'
import { authentication } from './Routes/Authentication'
import { routerCart } from './Routes/Cart'
import { routerChat } from './Routes/Chat'
import { routerProduct } from './Routes/Products'
import { routerRandom } from './Routes/Random'
import { save as saveMessages } from './Controllers/messages'
import { config } from './config'
import * as yargs from 'yargs'

const argv:any = yargs.options({
	p:{type: 'number', alias:'port', default:8080}
}).argv

const LocalStrategy = passportLocal.Strategy

dotenv.config()

mongoose.connect(`${config.mongoDB}`, (err) => {
	if (err) throw err
	console.log('Connected to Mongo')
})

// Middleware
const app = express()
app.use(express.json())
app.use(cors({ origin: `${config.FRONTEND}`, credentials: true }))
app.use(session({ secret: 'secretcode', resave: true, saveUninitialized: true }))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())

// Passport
passport.use(
	new LocalStrategy(async (username: string, password: string, done) => {
		await User.findOne({ username: username })
			.catch((err) => {
				if (err) throw err
			})
			.then((user: DatabaseUserInterface) => {
				if (!user) return done(null, false)
				bcrypt
					.compare(password, user.password)
					.catch((err) => {
						if (err) throw err
					})
					.then((result: boolean) => {
						if (result === true) {
							return done(null, user)
						} else {
							return done(null, false)
						}
					})
			})
	})
)

passport.serializeUser((user: DatabaseUserInterface, cb) => {
	cb(null, user._id)
})

passport.deserializeUser(async (id: string, cb) => {
	await User.findOne({ _id: id })
		.catch((err) => {
			cb(err, false)
		})
		.then((user: DatabaseUserInterface) => {
			const userInformation: UserInterface = {
				username: user.username,
				isAdmin: user.isAdmin,
				id: user._id,
			}
			cb(null, userInformation)
		})
})

// Routes
app.use(authentication)
app.use(routerCart)
app.use(routerChat)
app.use(routerProduct)
app.use(routerRandom)
app.get('/info', (req, res) => {
	// console.log(process.argv) // Argumentos de entrada
	// console.log(process.env.OS) // Sistema operativo
	// console.log(process.version) // Version de node
	// console.log(process.memoryUsage().rss) // Memoria total reservada
	// console.log(process.execPath) // Path de ejecucion
	// console.log(process.pid) // Process id 
	// console.log(process.env.INIT_CWD) // Carpeta del proyecto
	const info = {
		Arguments: process.argv,
		OS: process.env.OS,
		NodeVersion: process.version,
		MemoryReservedRSS: process.memoryUsage().rss,
		ExecPath: process.execPath,
		ProcessID: process.pid,
		Folder: process.env.INIT_CWD 
	}
	res.send(info)
})

// Socket io
const server = http.createServer(app)

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
	},
})

io.on('connection', (socket) => {
	console.log(`User Connected: ${socket.id}`)

	socket.on('disconnect', () => {
		console.log('user disconnected', socket.id)
	})

	socket.on('join_room', (data: string) => {
		socket.join(data)
		// console.log(`user with ID: ${socket.id} connect to room: ${data}`)
	})

	socket.on('send_message', (data) => {
		saveMessages(data)
		socket.to('chatRoom').emit('receive_message', data)
	})
})

const PORT = argv.p

// Server listener
server.listen(PORT, () => {
	console.log('Server started')
})
