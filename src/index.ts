require('dotenv').config()
import fs from 'fs'
import path from 'path'
import { Converter } from './converter'
import { MediumHttpClient } from './client'
import { StorageService } from './Services/StorageService'

void (async () => {
  const urls = [
  ]

  const httpClient = new MediumHttpClient()

  urls.forEach(async url => {
    const jsonArticle = await medium.getArticle(url)

    const jsonArticle = await httpClient.getArticle(url)
    const converter = new Converter(jsonArticle)

    converter.toMarkdownAsync().then(markdown => {
      StorageService.saveMarkdownFile(markdown.filename, markdown.content)
  })

  })
})()