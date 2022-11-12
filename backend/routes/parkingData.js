const request = require('request')

var express = require('express')
var router = express.Router()

var url = 'http://openapi.seoul.go.kr:8088/'
const key = '664462474168696e3537506f6d5445'
const type = 'json'
const service = 'IotVdata003'
var startIndex = 1
var endIndex = 2
var length = 3819

// 추가한 부분
var mysql = require('mysql')

// Connection 객체 생성

var connection = mysql.createConnection({
  host: 'database-1.cjudcyqtxqxm.us-west-1.rds.amazonaws.com',
  port: 3306,
  user: 'jihye',
  password: 'jihye0411',
  database: 'hong'
})
// var connection = mysql.createConnection({
//   host: 'localhost',
//   port: 3306,
//   user: 'root',
//   password: '9808',
//   database: 'hong'
// })

// Connect
connection.connect(function (err) {
  if (err) {
    console.error('mysql connection error')
    console.error(err)
    throw err
  } else {
    console.log('PARKING DB connected')
  }
})

router.post('/create', function (req, res) {
  connection.query(
    'CREATE TABLE if not exists parkingData (no INT NOT NULL AUTO_INCREMENT, serial VARCHAR(45) NULL, obsDate VARCHAR(45) NULL, parkingSpace INT NULL, currentSpace INT NULL, emptySpace INT NULL, PRIMARY KEY (no)) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8',
    function (err, row) {
      if (err) throw err
    }
  )
  res.json({
    success: true,
    message: 'data created!'
  })
})

router.get('/called', function (req, res) {
  // console.log(req)
  console.log('startIndex : ' + startIndex, 'endIndex: ' + endIndex)
  request(
    {
      url:
        url +
        key +
        '/' +
        type +
        '/' +
        service +
        '/' +
        startIndex +
        '/' +
        endIndex +
        '/',
      method: 'GET'
    },
    (error, response, body) => {
      const data = JSON.parse(body)
      console.log(data)

      res.send(data[service]['row'])
      console.log(data[service]['row'])
    }
  )
})

router.post('/update', function (req, res) {
  startIndex = req.body.start
  endIndex = req.body.end
  console.log('startIndex : ' + startIndex, 'endIndex: ' + endIndex)

  request(
    {
      url:
        url +
        key +
        '/' +
        type +
        '/' +
        service +
        '/' +
        startIndex +
        '/' +
        endIndex +
        '/',
      method: 'GET'
    },
    (error, response, body) => {
      const data = JSON.parse(body)
      console.log(data)

      // var length = data[service]['list_total_count']

      for (var i = 0; i < endIndex - startIndex + 1; i++) {
        connection.query(
          'INSERT INTO parkingData (serial,obsDate,parkingSpace,currentSpace,emptySpace) SELECT "' +
            data[service]['row'][i].COLUMN1 + // 시리얼
            '","' +
            data[service]['row'][i].COLUMN2 + // 관측시간
            '","' +
            data[service]['row'][i].COLUMN3 + // 총주차면수
            '","' +
            data[service]['row'][i].COLUMN4 + // 주차면수
            '","' +
            data[service]['row'][i].COLUMN5 + // 빈주차면수
            '" FROM DUAL WHERE NOT EXISTS (SELECT serial, obsDate FROM parkingData WHERE serial ="' +
            data[service]['row'][i].COLUMN1 +
            '" AND obsdate = "' +
            data[service]['row'][i].COLUMN2 +
            '")',
          function (err, row2) {
            if (err) throw err
          }
        )
      }
      res.json({
        success: true,
        message: 'data pushed!'
      })
    }
  )
})

module.exports = router
