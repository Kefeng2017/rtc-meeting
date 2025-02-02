/*
 * @Author: your name
 * @Date: 2020-03-23 21:37:21
 * @LastEditTime : 2020-04-11 13:17:46
 * @LastEditors  : kefeng
 * @Description: In User Settings Edit
 * @FilePath     : /rtc-meeting/server/requests/user.js
 */

const express = require('express')
const jwt = require('jsonwebtoken')
const query = require('../mysql/index')
const md5 = require('md5')
const { secretKey } = require('../auth/constant')

const user = express.Router()

user.get('/', (req, res) => {
  res.send('this is the user api')
})

/**
 * @description 用户登录接口
 * @params Object
 * @params name/email,password
 */
user.post('/login', (req, res) => {
  const user = req.body
  if (!user.name || !user.password) {
    res.json({ code: -1, msg: '用户名或密码不得为空' })
  } else {
    query('SELECT * FROM user WHERE name = ? OR email = ?', [user.name, user.name]).then(row => {
      if (row.length < 1) {
        res.json({ code: -1, msg: '用户不存在' })
      } else {
        let findUser = row[0]
        if (md5(user.password) === findUser.password) {
          // 生成token
          const token = jwt.sign({
            user_id: findUser.id,
            user_name: findUser.name,
            user_avatar: findUser.avatar,
            user_role: findUser.super
          }, secretKey, {
            expiresIn: 60 * 60 * 24 * 3
          })
          res.json({
            code: 0,
            msg: '登录成功',
            token,
            user: {
              id: findUser.id,
              name: findUser.name,
              role: findUser.super,
              avatar: findUser.avatar
            }
          })
        } else {
          res.json({
            code: -1,
            msg: '密码错误'
          })
        }
      }
    })
  }
})


/**
 * @description 注册接口
 * @params Object
 * @params name,email,password
 */
user.post('/register', (req, res) => {
  const user = req.body
  if (!user.name || !user.email || !user.password) {
    res.json({ code: -1, msg: '缺少必填字段' })
  } else {
    // 先查询是否已经注册
    query('SELECT * FROM user WHERE email = ?', [user.email]).then(row => {
      if (row.length > 0) {
        res.json({ code: 1001, registered: 1, msg: '该账号已注册，请直接登录' })
      } else {
        const encryptedPassword = md5(user.password)
        query('INSERT INTO user (name, email, password) VALUES (?, ?, ?)',
          [
            user.name,
            user.email,
            encryptedPassword
          ]).then(row => {
            console.log(row)
            const token = jwt.sign({
              user_id: row.insertId,
              user_name: user.name,
              user_avatar: '',
              user_role: 0
            }, secretKey, {
              expiresIn: 60 * 60 * 24 * 3
            })
            res.json({ code: 0, msg: '注册成功',token, user: {
              id: row.insertId,
              name: user.name,
              avatar: '',
              role: 0
            }})
          }).catch(err => {
            console.log(err)
            res.json({ code: -1, msg: '注册失败' })
          })
      }
    })
  }
})

module.exports = user