const fs = require('fs')
const axios = require('axios')
const sleep = require('sleep')
const cliProgress = require('cli-progress')

require('dotenv').config()

const README_FILENAME = '/README.md'
const TARGET_FILENAME = '/awesome-with-stars.md'
const DEBUG = false
// const DEBUG = true
let DATEBASE_NAME = 'db'

const getStar = async (repo) => {
  if (DEBUG) {
    return 0
  }
  const star = findDatabase({
    id: repo,
  })
  if (star && star.star) {
    return star.star
  } else if (repo.indexOf('undefined') > -1) {
    return 0
  } else if (repo.split('/').length != 2) {
    return 0
  } else {
    sleep.msleep(700)
    DEBUG && console.log('get star: ' + repo)
    const response = await axios.get('https://api.github.com/repos/' + repo, {
      auth: {
        username: process.env.GITHUB_USERNAME,
        password: process.env.GITHUB_TOKEN,
      },
      header: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36',
      },
    })
    saveDatabase({
      id: repo,
      star: response.data.stargazers_count,
    })
    return response.data.stargazers_count
  }
}

function initDatabase() {
  fs.writeFileSync(dbfile, '[]')
}

function findDatabase(data) {
  const dbfile = `./${DATEBASE_NAME}.json`
  DEBUG && console.log('find database: ' + dbfile)
  let database = []
  if (fs.existsSync(dbfile)) {
    database = require('./' + DATEBASE_NAME)
  }
  let index = database.findIndex((e) => e.id === data.id)
  return index === -1 ? null : database[index]
}

function saveDatabase(data) {
  const dbfile = `./${DATEBASE_NAME}.json`
  let database = []
  if (fs.existsSync(dbfile)) {
    database = require('./' + DATEBASE_NAME)
  }
  let index = database.findIndex((e) => e.id === data.id)
  let obj
  if (index === -1) {
    obj = data
    database.push(obj)
  } else {
    obj = Object.assign(database[index], data)
    database.splice(index, 1, obj)
  }

  fs.writeFileSync(dbfile, JSON.stringify(database, null, 2))
}

const proc = async (text) => {
  let total = 0
  let progres = 0

  const reg = /\[[^\n]*?\]\(([^\n]*?)\)/gim
  while ((itme = reg.exec(text))) {
    total++
  }
  DEBUG && console.log('total: ' + total)

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  progressBar.start(total, 0)

  const texts = []
  const indexs = []
  while ((itme = reg.exec(text))) {
    const link = itme[1]

    progressBar.update(progres++)
    if (link.startsWith('https://github.com')) {
      const repo = link.split('/')[3] + '/' + link.split('/')[4]

      try {
        const star = await getStar(repo)
        if (star > 0) {
          const length = ('' + star).length
          const blank = '&nbsp;'.repeat(6 - length)
          const text = `<code>${blank}${star}</code> ![](https://img.shields.io/github/last-commit/${repo}) `

          texts.push(text)
          indexs.push(itme.index)
        }
        // console.log(repo, star)
      } catch (e) {
        DEBUG && console.log(e)
        console.log('error: ' + repo)
      }
    }
  }
  let nText = text
  for (let index = indexs.length - 1; index >= 0; index--) {
    const idx = indexs[index]
    const text = texts[index]
    nText = nText.slice(0, idx) + text + nText.slice(idx)
  }
  progressBar.stop()
  return nText
}

;(async () => {
  const arguments = process.argv.splice(2)
  if (arguments.length > 1) {
    initDatabase()
  }
  DATEBASE_NAME = arguments[0].replace(/[\/|\.]*/g, '')

  const data = fs.readFileSync(arguments[0] + README_FILENAME, 'utf8')

  const content = await proc(data)

  fs.writeFileSync(arguments[0] + TARGET_FILENAME, content)
})()
