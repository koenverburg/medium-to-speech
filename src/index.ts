require('dotenv').config()
import fs from 'fs'
import path from 'path'
import { Converter } from './converter'
import { MediumHttpClient } from './client'
import { StorageService } from './Services/StorageService'
import { Speech } from './Speech'

void (async () => {
  const urls = [
  ]

  const httpClient = new MediumHttpClient()

  urls.forEach(async url => {
    const jsonArticle = await medium.getArticle(url)

    const jsonArticle = await httpClient.getArticle(url)
    const converter = new Converter(jsonArticle)
    const speechConverter = new Speech()

    converter.toMarkdownAsync().then(markdown => {
      StorageService.saveMarkdownFile(markdown.filename, markdown.content)
  })

    converter.toRawTextAsync().then(text => {
      speechConverter.ConvertToAudioFile(text.filename, text.filenameChunks, text.content).then(results => {
        console.log('results', results);
      })
    })

  })
})()