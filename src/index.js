const fs = require('fs')
const say = require('say')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const exporter = require('mediumexporter')

if (!fs.existsSync('audio-files')) fs.mkdirSync('audio-files')
if (!fs.existsSync('markdown-files')) fs.mkdirSync('markdown-files')

const cleanUrl = url => {
  const pattern = /\?source=bookmarks---------(\d+).+/gm
  const re = new RegExp(pattern)
  const match = re.exec(url)

  if (match) {
    return url.substring((url.length - match[0].length), -match[0].length);
  }

  return url
}

const readTextFile = () => {
  const textFile = path.resolve(process.cwd(), 'articles.txt')

  if (fs.existsSync(textFile)) {
    const content = fs.readFileSync(textFile, { encoding: 'utf-8'})
    return content.split('\n').map(line => line.trimRight()) // this will get rid of any \n\r stuff, just in case
  } else {
    console.log('no file found!')
    process.exit(0)
  }
}

const convertTextToSpeechFile = (text, fileName) => {
  say.export(text, 0.7, 'Alex', `audio-files/${fileName}.mp3`, err => {
    if (err) {
      return console.error(err)
    }

    console.log(`Text has been saved to ./audio-files/${fileName}.mp3`)
  })
}

const createFileName = url => {
  const pattern = /https:\/\/((\w.+)\/(.*)|(\w.+))\/((.*)(---------(\d+)------------------)|(.*))/gm
  const re = new RegExp(pattern)
  const match = re.exec(url)
  const publication = match[4] ? match[4] : match[3]
  const startNumber = match[6] ? match[6] : '000'
  return `${startNumber}_${publication}_${match[5].replace('?source=bookmarks', '')}`
}

const extractTextToSpeak = text => {
  const $ = cheerio.load(text)
  const contentSelector = $('body').find('.meteredContent')
  return contentSelector.text().trim().replace(/<img.*\/>/, '')
}

(async () => {
  const articles = readTextFile()
  // articles.forEach(async article => {
    // console.log('');
    const url = cleanUrl(articles[0])
    const fileName = createFileName(articles[0])

    console.log(`[*] original url: ${articles[0]}`);
    console.log(`[*] clean url: ${url}`);
    console.log(`[*] created the following filename: ${fileName}`);

    await exporter.getPost(url, {
      output: `markdown-files`,
      hugo: false,
      frontmatter: true
    })

    // const content = extractTextToSpeak(response.data)
    // convertTextToSpeechFile(content, fileName)

    console.log('[!] Done');
    console.log('');
  // })
})()

