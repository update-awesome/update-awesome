const fs = require('fs')
const axios = require('axios')
const sleep = require('sleep')
const cliProgress = require('cli-progress');

const GITHUB_USERNAME = 'romejiang'
const GITHUB_TOKEN = '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'
const README_FILENAME = '/README.md'
const TARGET_FILENAME = '/awesome-vue-with-stars.md'
const DEBUG = false

const getStar = async (repo) => {
  if (DEBUG) {
    return 0
  }
  const star = findDatabase({
    id: repo,
  })
  if (star && star.star) {
    return star.star
  } else if(repo.indexOf('undefined') > -1){
    return 0
  } else if(repo.split('/').length != 2){
    return 0
  }else{
    sleep.msleep(700)
    const response = await axios.get('https://api.github.com/repos/' + repo, {
      auth: {
        username: GITHUB_USERNAME,
        password: GITHUB_TOKEN,
      },
    })
    saveDatabase({
      id: repo,
      star: response.data.stargazers_count
    })
    return response.data.stargazers_count
  }
}

function initDatabase() {
  fs.writeFileSync(dbfile, '[]')
}

function findDatabase(data) {
  const dbfile = './db.json'
  let database = []
  if (fs.existsSync(dbfile)) {
    database = require('./db')
  }
  let index = database.findIndex((e) => e.id === data.id)
  return index === -1 ? null : database[index]
}

function saveDatabase(data) {
  const dbfile = './db.json'
  let database = []
  if (fs.existsSync(dbfile)) {
    database = require('./db')
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
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);


  const reg = /\[[^\n]*?\]\(([^\n]*?)\)/gim
  let total = 0
  let progres = 0
  while ((itme = reg.exec(text))) {
    total++
  }
  bar1.start(total, 0);
  // console.log("total:", total) 
  const texts = []
  const indexs = []
  while ((itme = reg.exec(text))) {
    const link = itme[1]
    progres++
    bar1.update(progres);
    if (link.startsWith('https://github.com')) {
      const repo = link.split('/')[3] + '/' + link.split('/')[4]
      if(link.split('/')[4] == 'undefined'){
        continue;
      }
      try {
        const star = await getStar(repo)
        const length = ('' + star).length
        const blank = '&nbsp;'.repeat(6 - length)
        const text = `<code>${blank}${star}</code> ![](https://img.shields.io/github/last-commit/${repo}) `

        texts.push(text)
        indexs.push(itme.index)
        // console.log(repo, star)
      } catch (e) {
        console.log(e.toString())
        console.log(repo)
      }
    }
  }
  console.log("total:", total)
  let nText = text
  for (let index = indexs.length - 1; index >= 0; index--) {
    const idx = indexs[index]
    const text = texts[index]
    nText = nText.slice(0, idx) + text + nText.slice(idx)
  }
  bar1.stop();
  return nText
}

;(async () => {
  const arguments = process.argv.splice(2)
  if (arguments.length > 1) {
    initDatabase()
  }
  const data = fs.readFileSync(arguments[0] + README_FILENAME, 'utf8')

  const content = await proc(data)

  fs.writeFileSync(arguments[0] + TARGET_FILENAME, content)
})()
