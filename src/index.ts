import { MediumHttpClient } from './client'
import { Converter } from './converter'
import fs from 'fs'
import path from 'path'

// const medium = new Client()
// MediumHttpClient.getArticle('https://medium.com/javascript-in-plain-english/a-practical-guide-to-become-a-senior-frontend-developer-553ec50e2933')

const jsonContent = fs.readFileSync(path.resolve(__dirname, '..', 'data', 'rich-culture.response.json'))

const verter = new Converter(JSON.parse(jsonContent.toString()))
verter.convert()