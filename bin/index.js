const fs = require('fs')
const say = require('say')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const exporter = require('mediumexporter')

if (!fs.existsSync('audio-files')) fs.mkdirSync('audio-files')
if (!fs.existsSync('markdown-files')) fs.mkdirSync('markdown-files')

const request = url => {
  return axios.get(url, { headers: {
    'Accept-Encoding': 'utf-8'
  }})
    .then(response => ({response}))
    .catch(error => ({error}))
}

const readTextFile = () => {
  const textFile = path.resolve(process.cwd(), 'articles.txt')

  if (fs.existsSync(textFile)) {
    const content = fs.readFileSync(textFile, { encoding: 'utf-8'})
    return content.split('\n').map(line => line.trimRight()) // this will get rid of any \n\r stuff
  } else {
    console.log('no file found!')
    process.exit(0)
  }
}

const convertTextToSpeechFile = (text, fileName) => {
  say.export(text, 'Alex', 0.7, `./audio-files/${fileName.publication}_${fileName.title}.mp3`, (err) => {
    if (err) {
      return console.error(err)
    }

    console.log('Text has been saved to hal.wav.')
  })
}

const createFileName = url => {
  const pattern = /https:\/\/((\w.+)\/(.*)|(\w.+))\/(.*)/gm
  const re = new RegExp(pattern)
  const match = re.exec(url)

  return {
    title: match[5],
    publication: match[4] ? match[4] : match[3]
  }
}

const extractTextToSpeak = text => {
  const $ = cheerio.load(text)
  const contentSelector = $('body').find('.meteredContent')
  return contentSelector.text().trim().replace(/<img.*\/>/, '')
}

void (async () => {
  const articles = readTextFile()
  articles.forEach(async article => {
    const fileName = createFileName(article)

    const { response, error } = await request(article)
    if (error) throw new Error(error)

    await exporter.getPost(url, {
      output: `markdown-files`,
      hugo: false,
      frontmatter: true
  })
})()

