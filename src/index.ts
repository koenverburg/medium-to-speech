require('dotenv').config()
import fs from 'fs'
import path from 'path'
import { Converter } from './converter'
import { MediumHttpClient } from './client'

void (async () => {
  const urls = [
  ]

  const medium = new MediumHttpClient()

  urls.forEach(async url => {
    const jsonArticle = await medium.getArticle(url)

    const verter = new Converter(jsonArticle)
    const files = await verter.convert()

    console.log('saved! in', files)
  })

})()