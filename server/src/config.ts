import dotenv from 'dotenv'

dotenv.config()

export const config = {
    mongoDB: process.env.PART1STRING+process.env.USER!+':'+process.env.PASSWORD+process.env.PART2STRING+process.env.DB+process.env.PART3STRING,
    FRONTEND: process.env.FRONTEND || 'http://localhost:3000',
}