const fs: any = require('fs')
const path: any = require('path')

import axios from 'axios';
const crypto = require('crypto')

const Cryptr = require('cryptr')

require('dotenv').config({ path: __dirname + '/.env' })

const setRequiredVariable = (variableName: string) => {
  if (process.env[variableName]) {
    return process.env[variableName];
  }
  throw new Error(`ENV-variable missing: ${variableName}`);
}

const cryptr = new Cryptr(setRequiredVariable('ENCRYPT_KEY'));


const encryptData = (variableName: string) => {
  return cryptr.encrypt(variableName)
}

const decryptData = (variableName: string) => {
  return cryptr.encrypt(variableName)
}



const getUserDetails = async (api_key: string, api_secret: string, api_url: string) => {
  // ${METHOD}${PATH}${api-expires}
  const expireTime = Date.now() + 5000
  const text = `GET/v2/user${expireTime}`
  const key = api_secret

  const sig = crypto.createHmac('sha256', key)
    .update(text)
    .digest('hex')

  try {
    var res = await axios({
      method: 'GET',
      url: api_url + '/v2/user',
      headers: {
        'api-key': api_key,
        'api-signature': sig,
        'api-expires': expireTime
      }
    })
  } catch (e: any) {
    return { code: e.code, ...e.response }
  }
  return res.data
}


const checkLoginKey = async (req: any, logger: any, res:any) => {
  try {
      if(req.body.body.login_api_apiKey_S.toString().length != 15) {
        throw "API key for logs not provided"
      }
    } catch(e) {
      logger.info("encrypt_login: " + "API key for logs not provided or not correct length: " + req.body.body.login_api_apiKey_S + " :" + encryptData(JSON.stringify(req.body)))
      return res.status(500).json({
        'message': 'Object error logger key not correct!'
      })
    }
}

const checkUserDetails = async(req: any, logger:any, res: any, route: string) => {
  try {
    const user: any = await getUserDetails(req.body.body.login_api_apiKey, req.body.body.login_api_secretKey, req.body.body.login_api_exchangeURL)
    logger.info(route + ": " + "fetch_user_data: " + req.body.body.login_api_apiKey_S.toString() +": " + encryptData(JSON.stringify(user)))
    return user
  } catch(e:any) {
    logger.info(route + ": " + "fetch_user_data_error: " +  req.body.body.login_api_apiKey_S.toString() +": " + e.toString() + " for__: " + encryptData(JSON.stringify(req.body)))
    return res.status(500).json({
      'message': 'Unable to login with these credentials!'
    })
  }
}

export {
  setRequiredVariable,
  getUserDetails,
  checkLoginKey,
  checkUserDetails,
  encryptData,
  decryptData
}